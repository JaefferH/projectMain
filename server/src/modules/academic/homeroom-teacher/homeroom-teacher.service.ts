// src/modules/academic/homeroom-teacher/homeroom-teacher.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { HomeroomTeacherMapper } from "./homeroom-teacher.mapper";
import { AssignHomeroomTeacherDto, UpdateHomeroomTeacherDto } from "./homeroom-teacher.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class HomeroomTeacherService {
  async getHomeroomTeachers(params: {
    page?: number; limit?: number; academicTermId?: string;
    academicYearId?: string; branchId?: string; teacherId?: string; isActive?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const cacheKey = `homeroomTeachers:list:${page}:${limit}:${params.branchId || 'all'}:${params.academicTermId || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.academicTermId && { academicTermId: params.academicTermId }),
        ...(params.teacherId && { teacherId: params.teacherId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.academicYearId && { academicTerm: { academicYearId: params.academicYearId } }),
        ...(params.branchId && { classroom: { branchId: params.branchId } }),
      };

      const [assignments, total] = await prisma.$transaction([
        prisma.homeroomTeacher.findMany({
          where, skip, take: limit,
          include: {
            teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
            classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } }, _count: { select: { studentEnrollments: true } } } },
            academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, academicYear: { select: { id: true, name: true } } } },
            _count: { select: { attendanceSessions: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.homeroomTeacher.count({ where }),
      ]);

      return { items: HomeroomTeacherMapper.toList(assignments), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 300);
  }

  async getHomeroomTeacherById(id: string) {
    return CacheUtils.getOrSet(`homeroomTeacher:${id}`, async () => {
      const assignment = await prisma.homeroomTeacher.findUnique({
        where: { id },
        include: {
          teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } }, _count: { select: { studentEnrollments: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, academicYear: { select: { id: true, name: true } } } },
          _count: { select: { attendanceSessions: true } },
        },
      });
      if (!assignment) throw new AppError("Homeroom teacher assignment not found.", 404);
      return HomeroomTeacherMapper.toDetail(assignment);
    }, 300);
  }

  async getMyHomeroomTeacher(userId: string, academicTermId?: string) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const cacheKey = `homeroomTeacher:student:${userId}:${academicTermId || 'current'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const hasStudentRole = studentProfile.user.role.some(r => r.role.name === SYSTEM_ROLES.STUDENT || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
      if (!hasStudentRole) throw new AppError("You don't have a student role.", 403);

      const enrollmentWhere: any = { studentId: studentProfile.id, isActive: true };
      if (academicTermId) enrollmentWhere.academicTermId = academicTermId;

      const enrollment = await prisma.studentEnrollment.findFirst({
        where: enrollmentWhere,
        include: {
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, isCurrent: true, academicYear: { select: { id: true, name: true, isCurrent: true } } } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!enrollment) return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, hasEnrollment: false, hasHomeroomTeacher: false, enrollment: null, homeroomTeacher: null };

      const homeroomTeacher = await prisma.homeroomTeacher.findFirst({
        where: { classroomId: enrollment.classroomId, academicTermId: enrollment.academicTermId, isActive: true },
        include: { teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } } },
      });

      const subjectTeachers = await prisma.teacherAssignment.findMany({
        where: { classroomId: enrollment.classroomId, academicTermId: enrollment.academicTermId },
        include: { teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } }, subject: { select: { id: true, name: true, code: true } } },
        orderBy: { subject: { name: "asc" } },
      });

      return {
        student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber },
        hasEnrollment: true, hasHomeroomTeacher: !!homeroomTeacher,
        enrollment: { id: enrollment.id, enrollmentDate: enrollment.enrollmentDate, classroom: enrollment.classroom, academicTerm: enrollment.academicTerm },
        homeroomTeacher: homeroomTeacher ? { id: homeroomTeacher.id, teacher: homeroomTeacher.teacher, assignedAt: homeroomTeacher.assignedAt } : null,
        subjectTeachers: subjectTeachers.map(st => ({ id: st.id, teacher: st.teacher, subject: st.subject, weeklyPeriods: st.weeklyPeriods })),
        summary: { totalSubjectTeachers: subjectTeachers.length, uniqueSubjects: new Set(subjectTeachers.map(st => st.subjectId)).size },
      };
    }, 120);
  }

  async assignHomeroomTeacher(data: AssignHomeroomTeacherDto) {
    const teacher = await prisma.userProfile.findUnique({ where: { id: data.teacherId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!teacher) throw new AppError("Teacher not found.", 404);
    const hasTeacherRole = teacher.user.role.some(r => r.role.name === SYSTEM_ROLES.TEACHER || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
    if (!hasTeacherRole) throw new AppError("User does not have a teaching role.", 400);

    const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId }, include: { branch: true } });
    if (!classroom) throw new AppError("Classroom not found.", 404);

    const academicTerm = await prisma.academicTerm.findUnique({ where: { id: data.academicTermId }, include: { academicYear: true } });
    if (!academicTerm) throw new AppError("Academic term not found.", 404);
    if (classroom.academicYearId !== academicTerm.academicYearId) throw new AppError("Classroom does not belong to the same academic year as the term.", 400);

    const existingClassroomAssignment = await prisma.homeroomTeacher.findFirst({ where: { classroomId: data.classroomId, academicTermId: data.academicTermId, isActive: true } });
    if (existingClassroomAssignment) throw new AppError("This classroom already has an active homeroom teacher for this term.", 409);

    const existingTeacherAssignment = await prisma.homeroomTeacher.findFirst({ where: { teacherId: data.teacherId, academicTermId: data.academicTermId, isActive: true } });
    if (existingTeacherAssignment) throw new AppError("This teacher is already assigned as homeroom teacher for another classroom in this term.", 409);

    const assignment = await prisma.homeroomTeacher.create({
      data: { teacherId: data.teacherId, classroomId: data.classroomId, academicTermId: data.academicTermId },
      include: {
        teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } }, _count: { select: { studentEnrollments: true } } } },
        academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { attendanceSessions: true } },
      },
    });

    await this.invalidateHomeroomCaches(data.classroomId, data.academicTermId);
    return HomeroomTeacherMapper.toResponse(assignment);
  }

  async updateHomeroomTeacher(id: string, data: UpdateHomeroomTeacherDto) {
    const assignment = await prisma.homeroomTeacher.findUnique({ where: { id }, include: { academicTerm: true, classroom: true } });
    if (!assignment) throw new AppError("Homeroom teacher assignment not found.", 404);

    if (data.teacherId) {
      const teacher = await prisma.userProfile.findUnique({ where: { id: data.teacherId }, include: { user: { include: { role: { include: { role: true } } } } } });
      if (!teacher) throw new AppError("Teacher not found.", 404);
      const hasTeacherRole = teacher.user.role.some(r => r.role.name === SYSTEM_ROLES.TEACHER || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
      if (!hasTeacherRole) throw new AppError("User does not have a teaching role.", 400);

      const existingAssignment = await prisma.homeroomTeacher.findFirst({ where: { teacherId: data.teacherId, academicTermId: assignment.academicTermId, isActive: true, NOT: { id } } });
      if (existingAssignment) throw new AppError("This teacher is already assigned as homeroom teacher for another classroom in this term.", 409);
    }

    const updatedAssignment = await prisma.homeroomTeacher.update({
      where: { id },
      data: { ...(data.teacherId && { teacherId: data.teacherId }), ...(data.isActive !== undefined && { isActive: data.isActive }) },
      include: {
        teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } }, _count: { select: { studentEnrollments: true } } } },
        academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { attendanceSessions: true } },
      },
    });

    await this.invalidateHomeroomCaches(updatedAssignment.classroomId, updatedAssignment.academicTermId, id);
    return HomeroomTeacherMapper.toResponse(updatedAssignment);
  }

  async deactivateHomeroomTeacher(id: string) {
    const assignment = await prisma.homeroomTeacher.findUnique({ where: { id } });
    if (!assignment) throw new AppError("Homeroom teacher assignment not found.", 404);
    if (!assignment.isActive) throw new AppError("Homeroom teacher assignment is already inactive.", 400);

    const updatedAssignment = await prisma.homeroomTeacher.update({
      where: { id }, data: { isActive: false },
      include: {
        teacher: { select: { id: true, fullName: true, employeeNumber: true } },
        classroom: { select: { id: true, name: true } },
        academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { attendanceSessions: true } },
      },
    });

    await this.invalidateHomeroomCaches(assignment.classroomId, assignment.academicTermId, id);
    return HomeroomTeacherMapper.toResponse(updatedAssignment);
  }

  async deleteHomeroomTeacher(id: string) {
    const assignment = await prisma.homeroomTeacher.findUnique({ where: { id } });
    if (!assignment) throw new AppError("Homeroom teacher assignment not found.", 404);
    await prisma.homeroomTeacher.delete({ where: { id } });
    await this.invalidateHomeroomCaches(assignment.classroomId, assignment.academicTermId, id, true);
    return { message: "Homeroom teacher assignment deleted successfully." };
  }

  async getMyHomeroomAssignment(userId: string, academicTermId?: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const cacheKey = `homeroomTeacher:my:${teacherProfile.id}:${academicTermId || 'current'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { teacherId: teacherProfile.id, isActive: true };
      if (academicTermId) where.academicTermId = academicTermId;

      const assignment = await prisma.homeroomTeacher.findFirst({
        where,
        include: {
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } }, _count: { select: { studentEnrollments: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, isCurrent: true, academicYear: { select: { id: true, name: true, isCurrent: true } } } },
          _count: { select: { attendanceSessions: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!assignment) return { teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber }, hasHomeroomAssignment: false, assignment: null };

      const students = await prisma.studentEnrollment.findMany({
        where: { classroomId: assignment.classroomId, academicTermId: assignment.academicTermId, isActive: true },
        include: { student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } } },
        orderBy: { student: { fullName: "asc" } },
      });

      return {
        teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber },
        hasHomeroomAssignment: true,
        assignment: HomeroomTeacherMapper.toResponse(assignment),
        students: students.map(e => ({ id: e.student.id, fullName: e.student.fullName, registrationNumber: e.student.registrationNumber, phone: e.student.phone, email: e.student.email, photoUrl: e.student.photoUrl })),
        summary: { totalStudents: students.length, classroomCapacity: assignment.classroom.capacity },
      };
    }, 120);
  }

  async getHomeroomTeacherByClassroom(classroomId: string, academicTermId: string) {
    const cacheKey = `homeroomTeacher:classroom:${classroomId}:${academicTermId}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const assignment = await prisma.homeroomTeacher.findFirst({
        where: { classroomId, academicTermId, isActive: true },
        include: {
          teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
          _count: { select: { attendanceSessions: true } },
        },
      });
      if (!assignment) throw new AppError("No homeroom teacher assigned for this classroom in this term.", 404);
      return HomeroomTeacherMapper.toResponse(assignment);
    }, 300);
  }

  private async invalidateHomeroomCaches(classroomId: string, academicTermId: string, assignmentId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'homeroomTeachers:list:*',
      'homeroomTeachers:my:*',
      'homeroomTeachers:student:*',
      'homeroomTeachers:classroom:*',
      `classroom:${classroomId}`,
      'dashboard:*',
    ];
    if (assignmentId) keysToDelete.push(`homeroomTeacher:${assignmentId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const homeroomTeacherService = new HomeroomTeacherService();