// src/modules/academic/teacher-assignment/teacher-assignment.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { TeacherAssignmentMapper } from "./teacher-assignment.mapper";
import { CreateTeacherAssignmentDto, UpdateTeacherAssignmentDto, BulkCreateTeacherAssignmentDto } from "./teacher-assignment.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class TeacherAssignmentService {
  async getTeacherAssignments(params: {
    page?: number; limit?: number; teacherId?: string; subjectId?: string;
    classroomId?: string; academicTermId?: string; academicYearId?: string; branchId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `teacherAssignments:list:${page}:${limit}:${params.teacherId || 'all'}:${params.classroomId || 'all'}:${params.academicTermId || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.teacherId && { teacherId: params.teacherId }),
        ...(params.subjectId && { subjectId: params.subjectId }),
        ...(params.classroomId && { classroomId: params.classroomId }),
        ...(params.academicTermId && { academicTermId: params.academicTermId }),
        ...(params.academicYearId && { academicTerm: { academicYearId: params.academicYearId } }),
        ...(params.branchId && { classroom: { branchId: params.branchId } }),
      };

      const [assignments, total] = await prisma.$transaction([
        prisma.teacherAssignment.findMany({
          where, skip, take: limit,
          include: {
            teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
            subject: { select: { id: true, name: true, code: true } },
            classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
            academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
            _count: { select: { assessments: true, timetableEntries: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.teacherAssignment.count({ where }),
      ]);

      return {
        items: TeacherAssignmentMapper.toList(assignments),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 120);
  }

  async getTeacherAssignmentById(id: string) {
    return CacheUtils.getOrSet(`teacherAssignment:${id}`, async () => {
      const assignment = await prisma.teacherAssignment.findUnique({
        where: { id },
        include: {
          teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true, address: true } },
          subject: { select: { id: true, name: true, code: true, description: true } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, academicYear: { select: { id: true, name: true } } } },
          _count: { select: { assessments: true, timetableEntries: true } },
        },
      });
      if (!assignment) throw new AppError("Teacher assignment not found.", 404);
      return TeacherAssignmentMapper.toDetail(assignment);
    }, 300);
  }

  async createTeacherAssignment(data: CreateTeacherAssignmentDto) {
    const teacher = await prisma.userProfile.findUnique({
      where: { id: data.teacherId },
      include: { user: { include: { role: { include: { role: true } } } } },
    });
    if (!teacher) throw new AppError("Teacher not found.", 404);

    const hasTeacherRole = teacher.user.role.some(
      r => r.role.name === SYSTEM_ROLES.TEACHER || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN
    );
    if (!hasTeacherRole) throw new AppError("User does not have a teaching role.", 400);

    const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
    if (!subject) throw new AppError("Subject not found.", 404);
    if (!subject.isActive) throw new AppError("Subject is not active.", 400);

    const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId }, include: { branch: true } });
    if (!classroom) throw new AppError("Classroom not found.", 404);

    const academicTerm = await prisma.academicTerm.findUnique({ where: { id: data.academicTermId }, include: { academicYear: true } });
    if (!academicTerm) throw new AppError("Academic term not found.", 404);
    if (classroom.academicYearId !== academicTerm.academicYearId) throw new AppError("Classroom does not belong to the same academic year as the term.", 400);

    const existingAssignment = await prisma.teacherAssignment.findFirst({
      where: { teacherId: data.teacherId, subjectId: data.subjectId, classroomId: data.classroomId, academicTermId: data.academicTermId },
    });
    if (existingAssignment) throw new AppError("This teacher is already assigned to this subject and classroom for this term.", 409);

    const subjectClassroomAssignment = await prisma.teacherAssignment.findFirst({
      where: { subjectId: data.subjectId, classroomId: data.classroomId, academicTermId: data.academicTermId, NOT: { teacherId: data.teacherId } },
    });
    if (subjectClassroomAssignment) throw new AppError("Another teacher is already assigned to this subject and classroom for this term.", 409);

    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId: data.teacherId, subjectId: data.subjectId, classroomId: data.classroomId, academicTermId: data.academicTermId, weeklyPeriods: data.weeklyPeriods },
      include: {
        teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
        subject: { select: { id: true, name: true, code: true } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
        academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { assessments: true, timetableEntries: true } },
      },
    });

    await this.invalidateAssignmentCaches(data.classroomId, data.teacherId);
    return TeacherAssignmentMapper.toResponse(assignment);
  }

  async bulkCreateTeacherAssignments(data: BulkCreateTeacherAssignmentDto) {
    const results = { successful: [] as any[], failed: [] as { assignment: CreateTeacherAssignmentDto; error: string }[] };
    for (const assignmentData of data.assignments) {
      try {
        const result = await this.createTeacherAssignment(assignmentData);
        results.successful.push(result);
      } catch (error: any) {
        results.failed.push({ assignment: assignmentData, error: error.message });
      }
    }
    return { message: `Created ${results.successful.length} assignments, ${results.failed.length} failed`, ...results };
  }

  async updateTeacherAssignment(id: string, data: UpdateTeacherAssignmentDto) {
    const assignment = await prisma.teacherAssignment.findUnique({ where: { id } });
    if (!assignment) throw new AppError("Teacher assignment not found.", 404);

    const teacherId = data.teacherId || assignment.teacherId;
    const subjectId = data.subjectId || assignment.subjectId;
    const classroomId = data.classroomId || assignment.classroomId;

    if (data.teacherId || data.subjectId || data.classroomId) {
      const existingAssignment = await prisma.teacherAssignment.findFirst({
        where: { teacherId, subjectId, classroomId, academicTermId: assignment.academicTermId, NOT: { id } },
      });
      if (existingAssignment) throw new AppError("An assignment with this teacher, subject, classroom, and term already exists.", 409);

      if (data.teacherId) {
        const teacher = await prisma.userProfile.findUnique({ where: { id: data.teacherId }, include: { user: { include: { role: { include: { role: true } } } } } });
        if (!teacher) throw new AppError("Teacher not found.", 404);
        const hasTeacherRole = teacher.user.role.some(r => r.role.name === SYSTEM_ROLES.TEACHER || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
        if (!hasTeacherRole) throw new AppError("User does not have a teaching role.", 400);
      }
      if (data.subjectId) {
        const subject = await prisma.subject.findUnique({ where: { id: data.subjectId } });
        if (!subject) throw new AppError("Subject not found.", 404);
        if (!subject.isActive) throw new AppError("Subject is not active.", 400);
      }
      if (data.classroomId) {
        const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId } });
        if (!classroom) throw new AppError("Classroom not found.", 404);
      }
    }

    const updatedAssignment = await prisma.teacherAssignment.update({
      where: { id },
      data: {
        ...(data.teacherId && { teacherId: data.teacherId }),
        ...(data.subjectId && { subjectId: data.subjectId }),
        ...(data.classroomId && { classroomId: data.classroomId }),
        ...(data.weeklyPeriods !== undefined && { weeklyPeriods: data.weeklyPeriods }),
      },
      include: {
        teacher: { select: { id: true, fullName: true, employeeNumber: true } },
        subject: { select: { id: true, name: true, code: true } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
        academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { assessments: true, timetableEntries: true } },
      },
    });

    await this.invalidateAssignmentCaches(updatedAssignment.classroomId, updatedAssignment.teacherId, id);
    return TeacherAssignmentMapper.toResponse(updatedAssignment);
  }

  async deleteTeacherAssignment(id: string) {
    const assignment = await prisma.teacherAssignment.findUnique({
      where: { id },
      include: { _count: { select: { assessments: true, timetableEntries: true } } },
    });
    if (!assignment) throw new AppError("Teacher assignment not found.", 404);
    if (assignment._count.assessments > 0 || assignment._count.timetableEntries > 0) {
      throw new AppError("Cannot delete assignment with existing assessments or timetable entries.", 400);
    }

    await prisma.teacherAssignment.delete({ where: { id } });
    await this.invalidateAssignmentCaches(assignment.classroomId, assignment.teacherId, id, true);
    return { message: "Teacher assignment deleted successfully." };
  }

  async getTeacherAssignmentsByTeacher(teacherId: string, params: { academicYearId?: string; academicTermId?: string }) {
    const teacher = await prisma.userProfile.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new AppError("Teacher not found.", 404);

    const cacheKey = `teacherAssignments:teacher:${teacherId}:${params.academicTermId || 'all'}:${params.academicYearId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { teacherId };
      if (params.academicTermId) where.academicTermId = params.academicTermId;
      if (params.academicYearId) where.academicTerm = { academicYearId: params.academicYearId };

      const assignments = await prisma.teacherAssignment.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, code: true } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
          _count: { select: { assessments: true, timetableEntries: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return TeacherAssignmentMapper.toList(assignments);
    }, 120);
  }

  async getTeacherAssignmentsByClassroom(classroomId: string) {
    const cacheKey = `teacherAssignments:classroom:${classroomId}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
      if (!classroom) throw new AppError("Classroom not found.", 404);

      const assignments = await prisma.teacherAssignment.findMany({
        where: { classroomId },
        include: {
          teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
          subject: { select: { id: true, name: true, code: true } },
          academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
        },
        orderBy: [{ subject: { name: "asc" } }, { teacher: { fullName: "asc" } }],
      });
      return TeacherAssignmentMapper.toList(assignments);
    }, 300);
  }

  async getMyAssignments(userId: string, params?: { academicTermId?: string; academicYearId?: string }) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const cacheKey = `teacherAssignments:my:${teacherProfile.id}:${params?.academicTermId || 'all'}:${params?.academicYearId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: { include: { role: true } } } });
      if (!user) throw new AppError("User not found.", 404);

      const hasTeacherRole = user.role.some(r => r.role.name === SYSTEM_ROLES.TEACHER || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
      if (!hasTeacherRole) throw new AppError("You don't have a teaching role.", 403);

      const where: any = { teacherId: teacherProfile.id };
      if (params?.academicTermId) where.academicTermId = params.academicTermId;
      if (params?.academicYearId) where.academicTerm = { academicYearId: params.academicYearId };

      const assignments = await prisma.teacherAssignment.findMany({
        where,
        include: {
          subject: { select: { id: true, name: true, code: true, description: true } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, isCurrent: true, academicYear: { select: { id: true, name: true, isCurrent: true } } } },
          _count: { select: { assessments: true, timetableEntries: true } },
        },
        orderBy: [{ academicTerm: { startDate: "desc" } }, { subject: { name: "asc" } }],
      });

      const grouped = assignments.reduce((acc: any, assignment: any) => {
        const termKey = assignment.academicTerm.id;
        if (!acc[termKey]) {
          acc[termKey] = {
            term: {
              id: assignment.academicTerm.id, name: assignment.academicTerm.name, type: assignment.academicTerm.type,
              startDate: assignment.academicTerm.startDate, endDate: assignment.academicTerm.endDate,
              isCurrent: assignment.academicTerm.isCurrent, academicYear: assignment.academicTerm.academicYear,
            },
            assignments: [],
          };
        }
        acc[termKey].assignments.push(assignment);
        return acc;
      }, {});

      return {
        teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber, phone: teacherProfile.phone, email: teacherProfile.email },
        assignments: TeacherAssignmentMapper.toList(assignments),
        groupedByTerm: Object.values(grouped),
        summary: {
          totalAssignments: assignments.length,
          uniqueSubjects: new Set(assignments.map(a => a.subjectId)).size,
          uniqueClassrooms: new Set(assignments.map(a => a.classroomId)).size,
          currentTermAssignments: assignments.filter(a => a.academicTerm.isCurrent).length,
        },
      };
    }, 120);
  }

  private async invalidateAssignmentCaches(classroomId: string, teacherId: string, assignmentId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'teacherAssignments:list:*',
      'teacherAssignments:my:*',
      'teacherAssignments:teacher:*',
      'teacherAssignments:classroom:*',
      'timetable:*',
      'dashboard:*',
      `classroom:${classroomId}`,
    ];
    if (assignmentId) keysToDelete.push(`teacherAssignment:${assignmentId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const teacherAssignmentService = new TeacherAssignmentService();