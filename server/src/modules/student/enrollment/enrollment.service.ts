// src/modules/student/enrollment/enrollment.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { EnrollmentMapper } from "./enrollment.mapper";
import { CreateEnrollmentDto, UpdateEnrollmentDto, BulkEnrollDto } from "./enrollment.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class EnrollmentService {
  async getEnrollments(params: {
    page?: number; limit?: number; studentId?: string;
    classroomId?: string; academicTermId?: string; academicYearId?: string; isActive?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const cacheKey = `enrollments:list:${page}:${limit}:${params.studentId || 'all'}:${params.classroomId || 'all'}:${params.academicTermId || 'all'}:${params.isActive ?? 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.studentId && { studentId: params.studentId }),
        ...(params.classroomId && { classroomId: params.classroomId }),
        ...(params.academicTermId && { academicTermId: params.academicTermId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.academicYearId && { academicTerm: { academicYearId: params.academicYearId } }),
      };

      const [enrollments, total] = await prisma.$transaction([
        prisma.studentEnrollment.findMany({
          where, skip, take: limit,
          include: {
            student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } },
            classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
            academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
            _count: { select: { assessmentResults: true, attendanceRecords: true, studentInvoices: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.studentEnrollment.count({ where }),
      ]);

      return {
        items: EnrollmentMapper.toList(enrollments),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 120);
  }

  async getEnrollmentById(id: string) {
    return CacheUtils.getOrSet(`enrollment:${id}`, async () => {
      const enrollment = await prisma.studentEnrollment.findUnique({
        where: { id },
        include: {
          student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, academicYear: { select: { id: true, name: true } } } },
          _count: { select: { assessmentResults: true, attendanceRecords: true, studentInvoices: true } },
        },
      });
      if (!enrollment) throw new AppError("Enrollment not found.", 404);
      return EnrollmentMapper.toResponse(enrollment);
    }, 300);
  }

  async getEnrollmentsByTeacherClassrooms(teacherUserId: string, params?: {
    academicTermId?: string; classroomId?: string; isActive?: boolean; search?: string; page?: number; limit?: number;
  }) {
    const page = params?.page ?? 1; const limit = params?.limit ?? 20;
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const assignmentWhere: any = { teacherId: teacherProfile.id, ...(params?.academicTermId && { academicTermId: params.academicTermId }), ...(params?.classroomId && { classroomId: params.classroomId }) };
    const assignments = await prisma.teacherAssignment.findMany({ where: assignmentWhere, select: { classroomId: true } });
    const classroomIds = [...new Set(assignments.map(a => a.classroomId))];
    if (classroomIds.length === 0) return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };

    const skip = (page - 1) * limit;
    const where: any = { classroomId: { in: classroomIds }, ...(params?.isActive !== undefined && { isActive: params.isActive }), ...(params?.academicTermId && { academicTermId: params.academicTermId }), ...(params?.search && { student: { OR: [{ fullName: { contains: params.search, mode: "insensitive" as const } }, { registrationNumber: { contains: params.search, mode: "insensitive" as const } }, { phone: { contains: params.search, mode: "insensitive" as const } }] } }) };
    const [enrollments, total] = await prisma.$transaction([prisma.studentEnrollment.findMany({ where, skip, take: limit, include: { student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } }, classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } }, academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } } }, orderBy: [{ classroom: { name: "asc" } }, { student: { fullName: "asc" } }] }), prisma.studentEnrollment.count({ where })]);
    return { items: EnrollmentMapper.toList(enrollments), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createEnrollment(data: CreateEnrollmentDto) {
    const student = await prisma.userProfile.findUnique({ where: { id: data.studentId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!student) throw new AppError("Student not found.", 404);
    const hasStudentRole = student.user.role.some(r => r.role.name === "STUDENT");
    if (!hasStudentRole) throw new AppError("User does not have STUDENT role.", 400);

    const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId }, include: { branch: true } });
    if (!classroom) throw new AppError("Classroom not found.", 404);
    const academicTerm = await prisma.academicTerm.findUnique({ where: { id: data.academicTermId }, include: { academicYear: true } });
    if (!academicTerm) throw new AppError("Academic term not found.", 404);
    if (classroom.academicYearId !== academicTerm.academicYearId) throw new AppError("Classroom does not belong to the same academic year as the term.", 400);

    const existingEnrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: data.studentId, academicTermId: data.academicTermId } });
    if (existingEnrollment) throw new AppError("Student is already enrolled in this academic term.", 409);

    if (classroom.capacity) {
      const activeEnrollments = await prisma.studentEnrollment.count({ where: { classroomId: data.classroomId, isActive: true } });
      if (activeEnrollments >= classroom.capacity) throw new AppError("Classroom has reached maximum capacity.", 400);
    }

    const enrollment = await prisma.studentEnrollment.create({
      data: { studentId: data.studentId, classroomId: data.classroomId, academicTermId: data.academicTermId, enrollmentDate: data.enrollmentDate ? new Date(data.enrollmentDate) : new Date() },
      include: {
        student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
        academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { assessmentResults: true, attendanceRecords: true, studentInvoices: true } },
      },
    });

    await this.invalidateEnrollmentCaches(data.classroomId, data.studentId);
    return EnrollmentMapper.toResponse(enrollment);
  }

  async bulkEnrollStudents(data: BulkEnrollDto) {
    const results = { successful: [] as any[], failed: [] as { enrollment: CreateEnrollmentDto; error: string }[] };
    for (const enrollmentData of data.enrollments) {
      try { const result = await this.createEnrollment(enrollmentData); results.successful.push(result); }
      catch (error: any) { results.failed.push({ enrollment: enrollmentData, error: error.message }); }
    }
    return { message: `Enrolled ${results.successful.length} students, ${results.failed.length} failed`, ...results };
  }

  async updateEnrollment(id: string, data: UpdateEnrollmentDto) {
    const enrollment = await prisma.studentEnrollment.findUnique({ where: { id } });
    if (!enrollment) throw new AppError("Enrollment not found.", 404);

    if (data.classroomId) {
      const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId } });
      if (!classroom) throw new AppError("Classroom not found.", 404);
      if (classroom.capacity && data.isActive !== false) {
        const activeEnrollments = await prisma.studentEnrollment.count({ where: { classroomId: data.classroomId, isActive: true, NOT: { id } } });
        if (activeEnrollments >= classroom.capacity) throw new AppError("Target classroom has reached maximum capacity.", 400);
      }
    }

    const updatedEnrollment = await prisma.studentEnrollment.update({
      where: { id },
      data: { ...(data.isActive !== undefined && { isActive: data.isActive }), ...(data.classroomId && { classroomId: data.classroomId }) },
      include: {
        student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
        academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { assessmentResults: true, attendanceRecords: true, studentInvoices: true } },
      },
    });

    await this.invalidateEnrollmentCaches(updatedEnrollment.classroomId, updatedEnrollment.studentId, id);
    return EnrollmentMapper.toResponse(updatedEnrollment);
  }

  async deleteEnrollment(id: string) {
    const enrollment = await prisma.studentEnrollment.findUnique({ where: { id }, include: { _count: { select: { assessmentResults: true, attendanceRecords: true, studentInvoices: true } } } });
    if (!enrollment) throw new AppError("Enrollment not found.", 404);
    if (enrollment._count.assessmentResults > 0 || enrollment._count.attendanceRecords > 0 || enrollment._count.studentInvoices > 0) {
      throw new AppError("Cannot delete enrollment with existing records. Deactivate it instead.", 400);
    }
    await prisma.studentEnrollment.delete({ where: { id } });
    await this.invalidateEnrollmentCaches(enrollment.classroomId, enrollment.studentId, id, true);
    return { message: "Enrollment deleted successfully." };
  }

  async getMyEnrollments(userId: string, params?: { academicTermId?: string }) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const cacheKey = `enrollments:my:${studentProfile.id}:${params?.academicTermId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { studentId: studentProfile.id };
      if (params?.academicTermId) where.academicTermId = params.academicTermId;

      const enrollments = await prisma.studentEnrollment.findMany({
        where,
        include: {
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
          academicTerm: { select: { id: true, name: true, type: true, startDate: true, endDate: true, isCurrent: true, academicYear: { select: { id: true, name: true, isCurrent: true } } } },
          _count: { select: { assessmentResults: true, attendanceRecords: true, studentInvoices: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber },
        enrollments: EnrollmentMapper.toList(enrollments),
        summary: { totalEnrollments: enrollments.length, activeEnrollments: enrollments.filter(e => e.isActive).length, currentTermEnrollments: enrollments.filter(e => e.academicTerm?.isCurrent).length },
      };
    }, 120);
  }

  private async invalidateEnrollmentCaches(classroomId: string, studentId: string, enrollmentId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'enrollments:list:*',
      'enrollments:my:*',
      `classroom:${classroomId}`,
      `classroom:${classroomId}:students`,
      'dashboard:*',
    ];
    if (enrollmentId) keysToDelete.push(`enrollment:${enrollmentId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const enrollmentService = new EnrollmentService();