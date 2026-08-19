// src/modules/academic/academic-year/academic-year.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { AcademicYearMapper } from "./academic-year.mapper";
import { CreateAcademicYearDto, UpdateAcademicYearDto } from "./academic-year.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class AcademicYearService {
  async getAcademicYears(params: {
    page?: number;
    limit?: number;
    branchId?: string;
    isCurrent?: boolean;
    search?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `academicYears:list:${page}:${limit}:${params.branchId || 'all'}:${params.isCurrent ?? 'all'}:${params.search || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const where: any = {
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.isCurrent !== undefined && { isCurrent: params.isCurrent }),
          ...(params.search && { name: { contains: params.search, mode: "insensitive" as const } }),
        };

        const [years, total] = await prisma.$transaction([
          prisma.academicYear.findMany({
            where, skip, take: limit,
            include: {
              branch: { select: { id: true, name: true, code: true } },
              _count: { select: { terms: true, classrooms: true, feeStructures: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.academicYear.count({ where }),
        ]);

        return {
          items: AcademicYearMapper.toList(years),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      300 // 5 minutes
    );
  }

  async getAcademicYearById(id: string) {
    const cacheKey = `academicYear:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const year = await prisma.academicYear.findUnique({
          where: { id },
          include: {
            branch: { select: { id: true, name: true, code: true } },
            terms: { orderBy: { startDate: "asc" } },
            _count: { select: { terms: true, classrooms: true, feeStructures: true } },
          },
        });
        if (!year) throw new AppError("Academic year not found.", 404);
        return AcademicYearMapper.toDetail(year);
      },
      600 // 10 minutes
    );
  }

  async createAcademicYear(data: CreateAcademicYearDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const existingYear = await prisma.academicYear.findFirst({
      where: { branchId: data.branchId, name: data.name },
    });
    if (existingYear) throw new AppError("Academic year with this name already exists in this branch.", 409);

    if (data.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { branchId: data.branchId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const year = await prisma.academicYear.create({
      data: {
        branchId: data.branchId, name: data.name,
        startDate: new Date(data.startDate), endDate: new Date(data.endDate),
        isCurrent: data.isCurrent ?? false,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { terms: true, classrooms: true, feeStructures: true } },
      },
    });

    await this.invalidateAcademicYearCaches(data.branchId);

    return AcademicYearMapper.toResponse(year);
  }

  async updateAcademicYear(id: string, data: UpdateAcademicYearDto) {
    const year = await prisma.academicYear.findUnique({ where: { id } });
    if (!year) throw new AppError("Academic year not found.", 404);

    if (data.name) {
      const existingYear = await prisma.academicYear.findFirst({
        where: { branchId: year.branchId, name: data.name, NOT: { id } },
      });
      if (existingYear) throw new AppError("Academic year with this name already exists in this branch.", 409);
    }

    if (data.isCurrent) {
      await prisma.academicYear.updateMany({
        where: { branchId: year.branchId, isCurrent: true, NOT: { id } },
        data: { isCurrent: false },
      });
    }

    const updatedYear = await prisma.academicYear.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.isCurrent !== undefined && { isCurrent: data.isCurrent }),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { terms: true, classrooms: true, feeStructures: true } },
      },
    });

    await this.invalidateAcademicYearCaches(year.branchId, id);

    return AcademicYearMapper.toResponse(updatedYear);
  }

  async deleteAcademicYear(id: string) {
    const year = await prisma.academicYear.findUnique({
      where: { id },
      include: { _count: { select: { terms: true, classrooms: true, feeStructures: true } } },
    });
    if (!year) throw new AppError("Academic year not found.", 404);

    if (year._count.terms > 0 || year._count.classrooms > 0 || year._count.feeStructures > 0) {
      throw new AppError("Cannot delete academic year with existing terms, classrooms, or fee structures.", 400);
    }

    await prisma.academicYear.delete({ where: { id } });
    await this.invalidateAcademicYearCaches(year.branchId, id, true);

    return { message: "Academic year deleted successfully." };
  }

  async setCurrentAcademicYear(id: string) {
    const year = await prisma.academicYear.findUnique({ where: { id } });
    if (!year) throw new AppError("Academic year not found.", 404);

    await prisma.$transaction([
      prisma.academicYear.updateMany({
        where: { branchId: year.branchId, isCurrent: true },
        data: { isCurrent: false },
      }),
      prisma.academicYear.update({ where: { id }, data: { isCurrent: true } }),
    ]);

    await this.invalidateAcademicYearCaches(year.branchId);

    return AcademicYearMapper.toResponse(
      await prisma.academicYear.findUnique({
        where: { id },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          _count: { select: { terms: true, classrooms: true, feeStructures: true } },
        },
      })!
    );
  }

  private async invalidateAcademicYearCaches(branchId: string, yearId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'academicYears:list:*',
      'academicYears:current:*',
      'calendar:*',
      'dashboard:*',
    ];

    if (yearId) {
      keysToDelete.push(`academicYear:${yearId}`);
      if (isDelete) keysToDelete.push(`academicYear:${yearId}:*`);
    }

    await Promise.all(keysToDelete.map(key =>
      key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }
}

export const academicYearService = new AcademicYearService();