// src/modules/organization/organization.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../shared/errors/AppError";
import { OrganizationMapper } from "./organization.mapper";
import { CreateOrganizationDto, UpdateOrganizationDto } from "./organization.validation";
import { CacheUtils } from "../../shared/utils/cache.utils";

class OrganizationService {
  async getOrganizations(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    // Cache key based on query parameters
    const cacheKey = `organizations:list:${page}:${limit}:${params.search || 'all'}:${params.isActive ?? 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const where: any = {
          ...(params.isActive !== undefined && {
            isActive: params.isActive,
          }),
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { code: { contains: params.search, mode: "insensitive" as const } },
              { email: { contains: params.search, mode: "insensitive" as const } },
            ],
          }),
        };

        const [organizations, total] = await prisma.$transaction([
          prisma.organization.findMany({
            where,
            skip,
            take: limit,
            include: {
              _count: {
                select: {
                  branches: true,
                  users: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.organization.count({ where }),
        ]);

        return {
          items: OrganizationMapper.toList(organizations),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      },
      300 // Cache for 5 minutes
    );
  }

  async getOrganizationById(id: string) {
    const cacheKey = `organization:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const organization = await prisma.organization.findUnique({
          where: { id },
          include: {
            branches: {
              where: { isActive: true },
              select: {
                id: true,
                name: true,
                code: true,
                isMainCampus: true,
                isActive: true,
                city: true,
              },
            },
            _count: {
              select: {
                branches: true,
                users: true,
              },
            },
          },
        });

        if (!organization) {
          throw new AppError("Organization not found.", 404);
        }

        return OrganizationMapper.toDetail(organization);
      },
      600 // Cache for 10 minutes
    );
  }

  async createOrganization(data: CreateOrganizationDto) {
    // Check if code already exists
    const existingCode = await prisma.organization.findUnique({
      where: { code: data.code },
    });

    if (existingCode) {
      throw new AppError("Organization code already exists.", 409);
    }

    // Check if email already exists (if provided)
    if (data.email) {
      const existingEmail = await prisma.organization.findFirst({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new AppError("Organization email already exists.", 409);
      }
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        code: data.code,
        logoUrl: data.logoUrl,
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address,
        isActive: data.isActive ?? true,
      },
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });

    // Invalidate organizations list cache
    await CacheUtils.invalidatePattern('organizations:list:*');
    
    return OrganizationMapper.toResponse(organization);
  }

  async updateOrganization(id: string, data: UpdateOrganizationDto) {
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new AppError("Organization not found.", 404);
    }

    // Check code uniqueness if being updated
    if (data.code) {
      const existingCode = await prisma.organization.findFirst({
        where: {
          code: data.code,
          NOT: { id },
        },
      });

      if (existingCode) {
        throw new AppError("Organization code already exists.", 409);
      }
    }

    // Check email uniqueness if being updated
    if (data.email) {
      const existingEmail = await prisma.organization.findFirst({
        where: {
          email: data.email,
          NOT: { id },
        },
      });

      if (existingEmail) {
        throw new AppError("Organization email already exists.", 409);
      }
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });

    // Invalidate caches
    await Promise.all([
      CacheUtils.delete(`organization:${id}`),
      CacheUtils.invalidatePattern('organizations:list:*'),
    ]);

    return OrganizationMapper.toResponse(updatedOrganization);
  }

  async deleteOrganization(id: string) {
    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });

    if (!organization) {
      throw new AppError("Organization not found.", 404);
    }

    // Check if organization has active branches or users
    if (organization._count.branches > 0 || organization._count.users > 0) {
      throw new AppError(
        "Cannot delete organization with active branches or users. Deactivate it instead or remove all branches and users first.",
        400
      );
    }

    await prisma.organization.delete({
      where: { id },
    });

    // Invalidate caches
    await Promise.all([
      CacheUtils.delete(`organization:${id}`),
      CacheUtils.invalidatePattern('organizations:list:*'),
    ]);

    return { message: "Organization deleted permanently." };
  }

  async toggleOrganizationStatus(id: string) {
    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new AppError("Organization not found.", 404);
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        isActive: !organization.isActive,
      },
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });

    // Invalidate caches
    await Promise.all([
      CacheUtils.delete(`organization:${id}`),
      CacheUtils.invalidatePattern('organizations:list:*'),
    ]);

    return OrganizationMapper.toResponse(updatedOrganization);
  }
}

export const organizationService = new OrganizationService();