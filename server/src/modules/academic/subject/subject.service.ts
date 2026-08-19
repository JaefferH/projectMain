// src/modules/academic/subject/subject.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { SubjectMapper } from "./subject.mapper";
import { CreateSubjectDto, UpdateSubjectDto } from "./subject.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class SubjectService {
  async getSubjects(params: {
    page?: number;
    limit?: number;
    organizationId?: string;
    branchId?: string;
    isActive?: boolean;
    search?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `subjects:list:${page}:${limit}:${params.organizationId || 'all'}:${params.branchId || 'all'}:${params.isActive ?? 'all'}:${params.search || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const where: any = {
          ...(params.organizationId && { organizationId: params.organizationId }),
          ...(params.branchId !== undefined && { branchId: params.branchId }),
          ...(params.isActive !== undefined && { isActive: params.isActive }),
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { code: { contains: params.search, mode: "insensitive" as const } },
              { description: { contains: params.search, mode: "insensitive" as const } },
            ],
          }),
        };

        const [subjects, total] = await prisma.$transaction([
          prisma.subject.findMany({
            where,
            skip,
            take: limit,
            include: {
              organization: { select: { id: true, name: true, code: true } },
              branch: { select: { id: true, name: true, code: true } },
              _count: { select: { teacherAssignments: true } },
            },
            orderBy: { name: "asc" },
          }),
          prisma.subject.count({ where }),
        ]);

        return {
          items: SubjectMapper.toList(subjects),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      600
    );
  }

  async getSubjectById(id: string) {
    const cacheKey = `subject:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const subject = await prisma.subject.findUnique({
          where: { id },
          include: {
            organization: { select: { id: true, name: true, code: true } },
            branch: { select: { id: true, name: true, code: true } },
            _count: { select: { teacherAssignments: true } },
          },
        });

        if (!subject) throw new AppError("Subject not found.", 404);
        return SubjectMapper.toResponse(subject);
      },
      600
    );
  }

  async createSubject(data: CreateSubjectDto) {
    const organization = await prisma.organization.findUnique({ where: { id: data.organizationId } });
    if (!organization) throw new AppError("Organization not found.", 404);

    const existingCode = await prisma.subject.findFirst({
      where: { organizationId: data.organizationId, code: data.code },
    });
    if (existingCode) throw new AppError("Subject code already exists in this organization.", 409);

    if (data.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
      if (!branch) throw new AppError("Branch not found.", 404);
      if (branch.organizationId !== data.organizationId) throw new AppError("Branch does not belong to this organization.", 400);
    }

    const subject = await prisma.subject.create({
      data: {
        organizationId: data.organizationId,
        code: data.code,
        name: data.name,
        description: data.description,
        branchId: data.branchId || null,
        isActive: data.isActive ?? true,
      },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { teacherAssignments: true } },
      },
    });

    await CacheUtils.invalidatePattern('subjects:list:*');
    return SubjectMapper.toResponse(subject);
  }

  async updateSubject(id: string, data: UpdateSubjectDto) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new AppError("Subject not found.", 404);

    if (data.code) {
      const existingCode = await prisma.subject.findFirst({
        where: { organizationId: subject.organizationId, code: data.code, NOT: { id } },
      });
      if (existingCode) throw new AppError("Subject code already exists in this organization.", 409);
    }

    if (data.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
      if (!branch) throw new AppError("Branch not found.", 404);
      if (branch.organizationId !== subject.organizationId) throw new AppError("Branch does not belong to this organization.", 400);
    }

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: {
        ...(data.code && { code: data.code }),
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.branchId !== undefined && { branchId: data.branchId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { teacherAssignments: true } },
      },
    });

    await Promise.all([
      CacheUtils.delete(`subject:${id}`),
      CacheUtils.invalidatePattern('subjects:list:*'),
    ]);

    return SubjectMapper.toResponse(updatedSubject);
  }

  async deleteSubject(id: string) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: { _count: { select: { teacherAssignments: true } } },
    });
    if (!subject) throw new AppError("Subject not found.", 404);
    if (subject._count.teacherAssignments > 0) {
      throw new AppError("Cannot delete subject with existing teacher assignments.", 400);
    }

    await prisma.subject.delete({ where: { id } });
    await Promise.all([
      CacheUtils.delete(`subject:${id}`),
      CacheUtils.invalidatePattern('subjects:list:*'),
    ]);
    return { message: "Subject deleted successfully." };
  }

  async toggleSubjectStatus(id: string) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) throw new AppError("Subject not found.", 404);

    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: { isActive: !subject.isActive },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        _count: { select: { teacherAssignments: true } },
      },
    });

    await Promise.all([
      CacheUtils.delete(`subject:${id}`),
      CacheUtils.invalidatePattern('subjects:list:*'),
    ]);
    return SubjectMapper.toResponse(updatedSubject);
  }
}

export const subjectService = new SubjectService();