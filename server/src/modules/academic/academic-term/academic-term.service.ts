// src/modules/academic/academic-term/academic-term.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { AcademicTermMapper } from "./academic-term.mapper";
import { CreateAcademicTermDto, UpdateAcademicTermDto } from "./academic-term.validation";
import { AcademicTermType as PrismaAcademicTermType } from "@prisma/client";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class AcademicTermService {
  async getAcademicTerms(params: {
    page?: number;
    limit?: number;
    academicYearId?: string;
    isCurrent?: boolean;
    type?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `academicTerms:list:${page}:${limit}:${params.academicYearId || 'all'}:${params.isCurrent ?? 'all'}:${params.type || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const where: any = {
          ...(params.academicYearId && { academicYearId: params.academicYearId }),
          ...(params.isCurrent !== undefined && { isCurrent: params.isCurrent }),
          ...(params.type && { type: params.type as PrismaAcademicTermType }),
        };

        const [terms, total] = await prisma.$transaction([
          prisma.academicTerm.findMany({
            where, skip, take: limit,
            include: {
              academicYear: {
                select: { id: true, name: true, branch: { select: { id: true, name: true } } },
              },
              _count: { select: { studentEnrollments: true, teacherAssignments: true } },
            },
            orderBy: { startDate: "asc" },
          }),
          prisma.academicTerm.count({ where }),
        ]);

        return {
          items: AcademicTermMapper.toList(terms),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      300 // 5 minutes
    );
  }

  async getAcademicTermById(id: string) {
    const cacheKey = `academicTerm:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const term = await prisma.academicTerm.findUnique({
          where: { id },
          include: {
            academicYear: {
              select: { id: true, name: true, branch: { select: { id: true, name: true } } },
            },
            _count: { select: { studentEnrollments: true, teacherAssignments: true } },
          },
        });
        if (!term) throw new AppError("Academic term not found.", 404);
        return AcademicTermMapper.toResponse(term);
      },
      600 // 10 minutes
    );
  }

  async createAcademicTerm(data: CreateAcademicTermDto) {
    const year = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!year) throw new AppError("Academic year not found.", 404);

    const termType = data.type as PrismaAcademicTermType;
    const existingTerm = await prisma.academicTerm.findFirst({
      where: { academicYearId: data.academicYearId, type: termType },
    });
    if (existingTerm) throw new AppError("This term type already exists in this academic year.", 409);

    if (data.isCurrent) {
      await prisma.academicTerm.updateMany({
        where: { academicYearId: data.academicYearId, isCurrent: true },
        data: { isCurrent: false },
      });
    }

    const term = await prisma.academicTerm.create({
      data: {
        academicYearId: data.academicYearId, name: data.name, type: termType,
        startDate: new Date(data.startDate), endDate: new Date(data.endDate),
        isCurrent: data.isCurrent ?? false,
      },
      include: {
        academicYear: {
          select: { id: true, name: true, branch: { select: { id: true, name: true } } },
        },
        _count: { select: { studentEnrollments: true, teacherAssignments: true } },
      },
    });

    await this.invalidateTermCaches(data.academicYearId);

    return AcademicTermMapper.toResponse(term);
  }

  async updateAcademicTerm(id: string, data: UpdateAcademicTermDto) {
    const term = await prisma.academicTerm.findUnique({ where: { id } });
    if (!term) throw new AppError("Academic term not found.", 404);

    if (data.type) {
      const termType = data.type as PrismaAcademicTermType;
      const existingTerm = await prisma.academicTerm.findFirst({
        where: { academicYearId: term.academicYearId, type: termType, NOT: { id } },
      });
      if (existingTerm) throw new AppError("This term type already exists in this academic year.", 409);
    }

    if (data.isCurrent) {
      await prisma.academicTerm.updateMany({
        where: { academicYearId: term.academicYearId, isCurrent: true, NOT: { id } },
        data: { isCurrent: false },
      });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.type) updateData.type = data.type as PrismaAcademicTermType;
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.isCurrent !== undefined) updateData.isCurrent = data.isCurrent;

    const updatedTerm = await prisma.academicTerm.update({
      where: { id }, data: updateData,
      include: {
        academicYear: {
          select: { id: true, name: true, branch: { select: { id: true, name: true } } },
        },
        _count: { select: { studentEnrollments: true, teacherAssignments: true } },
      },
    });

    await this.invalidateTermCaches(term.academicYearId, id);

    return AcademicTermMapper.toResponse(updatedTerm);
  }

  async deleteAcademicTerm(id: string) {
    const term = await prisma.academicTerm.findUnique({
      where: { id },
      include: { _count: { select: { studentEnrollments: true, teacherAssignments: true } } },
    });
    if (!term) throw new AppError("Academic term not found.", 404);

    if (term._count.studentEnrollments > 0 || term._count.teacherAssignments > 0) {
      throw new AppError("Cannot delete term with existing enrollments or assignments.", 400);
    }

    await prisma.academicTerm.delete({ where: { id } });
    await this.invalidateTermCaches(term.academicYearId, id, true);

    return { message: "Academic term deleted successfully." };
  }

  private async invalidateTermCaches(academicYearId: string, termId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'academicTerms:list:*',
      `academicYear:${academicYearId}`,
      'academicYears:list:*',
      'calendar:*',
      'dashboard:*',
    ];

    if (termId) {
      keysToDelete.push(`academicTerm:${termId}`);
      if (isDelete) keysToDelete.push(`academicTerm:${termId}:*`);
    }

    await Promise.all(keysToDelete.map(key =>
      key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }
}

export const academicTermService = new AcademicTermService();