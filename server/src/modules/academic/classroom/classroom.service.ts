// src/modules/academic/classroom/classroom.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { ClassroomMapper } from "./classroom.mapper";
import { CreateClassroomDto, UpdateClassroomDto } from "./classroom.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class ClassroomService {
  async getClassrooms(params: {
    page?: number;
    limit?: number;
    branchId?: string;
    academicYearId?: string;
    search?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `classrooms:list:${page}:${limit}:${params.branchId || 'all'}:${params.academicYearId || 'all'}:${params.search || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const where: any = {
          ...(params.branchId && { branchId: params.branchId }),
          ...(params.academicYearId && { academicYearId: params.academicYearId }),
          ...(params.search && { name: { contains: params.search, mode: "insensitive" as const } }),
        };

        const [classrooms, total] = await prisma.$transaction([
          prisma.classroom.findMany({
            where, skip, take: limit,
            include: {
              branch: { select: { id: true, name: true, code: true } },
              academicYear: { select: { id: true, name: true } },
              _count: { select: { studentEnrollments: true, teacherAssignments: true } },
            },
            orderBy: { name: "asc" },
          }),
          prisma.classroom.count({ where }),
        ]);

        return {
          items: ClassroomMapper.toList(classrooms),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      300 // 5 minutes
    );
  }

  async getClassroomById(id: string) {
    const cacheKey = `classroom:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const classroom = await prisma.classroom.findUnique({
          where: { id },
          include: {
            branch: { select: { id: true, name: true, code: true } },
            academicYear: { select: { id: true, name: true } },
            studentEnrollments: {
              where: { isActive: true },
              include: { student: { select: { id: true, fullName: true } } },
            },
            teacherAssignments: {
              include: {
                teacher: { select: { id: true, fullName: true } },
                subject: { select: { id: true, name: true, code: true } },
              },
            },
            _count: { select: { studentEnrollments: true, teacherAssignments: true } },
          },
        });
        if (!classroom) throw new AppError("Classroom not found.", 404);
        return ClassroomMapper.toDetail(classroom);
      },
      600 // 10 minutes
    );
  }

  async getClassroomsByAcademicYear(academicYearId: string) {
    const cacheKey = `classrooms:academicYear:${academicYearId}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId } });
        if (!academicYear) throw new AppError("Academic year not found.", 404);

        const classrooms = await prisma.classroom.findMany({
          where: { academicYearId },
          include: {
            branch: { select: { id: true, name: true, code: true } },
            _count: { select: { studentEnrollments: true, teacherAssignments: true } },
          },
          orderBy: { name: "asc" },
        });
        return ClassroomMapper.toList(classrooms);
      },
      600 // 10 minutes
    );
  }

  async createClassroom(data: CreateClassroomDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!academicYear) throw new AppError("Academic year not found.", 404);
    if (academicYear.branchId !== data.branchId) throw new AppError("Academic year does not belong to this branch.", 400);

    const existingClassroom = await prisma.classroom.findFirst({
      where: { academicYearId: data.academicYearId, name: data.name },
    });
    if (existingClassroom) throw new AppError("Classroom with this name already exists in this academic year.", 409);

    const classroom = await prisma.classroom.create({
      data: { branchId: data.branchId, academicYearId: data.academicYearId, name: data.name, capacity: data.capacity },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { studentEnrollments: true, teacherAssignments: true } },
      },
    });

    await this.invalidateClassroomCaches(data.branchId, data.academicYearId);

    return ClassroomMapper.toResponse(classroom);
  }

  async updateClassroom(id: string, data: UpdateClassroomDto) {
    const classroom = await prisma.classroom.findUnique({ where: { id } });
    if (!classroom) throw new AppError("Classroom not found.", 404);

    if (data.name) {
      const academicYearId = data.academicYearId || classroom.academicYearId;
      const existingClassroom = await prisma.classroom.findFirst({
        where: { academicYearId, name: data.name, NOT: { id } },
      });
      if (existingClassroom) throw new AppError("Classroom with this name already exists.", 409);
    }

    const updatedClassroom = await prisma.classroom.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.academicYearId && { academicYearId: data.academicYearId }),
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, name: true } },
        _count: { select: { studentEnrollments: true, teacherAssignments: true } },
      },
    });

    await this.invalidateClassroomCaches(classroom.branchId, classroom.academicYearId, id);

    return ClassroomMapper.toResponse(updatedClassroom);
  }

  async deleteClassroom(id: string) {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: { _count: { select: { studentEnrollments: true, teacherAssignments: true } } },
    });
    if (!classroom) throw new AppError("Classroom not found.", 404);

    if (classroom._count.studentEnrollments > 0 || classroom._count.teacherAssignments > 0) {
      throw new AppError("Cannot delete classroom with existing students or teachers.", 400);
    }

    await prisma.classroom.delete({ where: { id } });
    await this.invalidateClassroomCaches(classroom.branchId, classroom.academicYearId, id, true);

    return { message: "Classroom deleted successfully." };
  }

  private async invalidateClassroomCaches(branchId: string, academicYearId: string, classroomId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'classrooms:list:*',
      `classrooms:academicYear:${academicYearId}`,
      'timetable:*',
      'dashboard:*',
    ];

    if (classroomId) {
      keysToDelete.push(`classroom:${classroomId}`);
      if (isDelete) keysToDelete.push(`classroom:${classroomId}:*`);
    }

    await Promise.all(keysToDelete.map(key =>
      key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }
}

export const classroomService = new ClassroomService();