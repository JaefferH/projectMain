// src/modules/student/guardian/guardian.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { GuardianMapper } from "./guardian.mapper";
import { CreateGuardianDto, UpdateGuardianDto, LinkGuardianToStudentDto } from "./guardian.validation";
import { SYSTEM_ROLES } from "@shared/constants/roles";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class GuardianService {
  async getGuardians(params: {
    page?: number; limit?: number; branchId?: string; search?: string; studentId?: string;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 10;
    const cacheKey = `guardians:list:${page}:${limit}:${params.branchId || 'all'}:${params.studentId || 'all'}:${params.search || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.studentId && { students: { some: { studentId: params.studentId } } }),
        ...(params.search && { OR: [{ fullName: { contains: params.search, mode: "insensitive" as const } }, { phone: { contains: params.search, mode: "insensitive" as const } }, { email: { contains: params.search, mode: "insensitive" as const } }, { nationalId: { contains: params.search, mode: "insensitive" as const } }] }),
      };

      const [guardians, total] = await prisma.$transaction([
        prisma.guardian.findMany({ where, skip, take: limit, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { students: true } } }, orderBy: { fullName: "asc" } }),
        prisma.guardian.count({ where }),
      ]);

      return { items: GuardianMapper.toList(guardians), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 300);
  }

  async getGuardianById(id: string) {
    return CacheUtils.getOrSet(`guardian:${id}`, async () => {
      const guardian = await prisma.guardian.findUnique({
        where: { id },
        include: { branch: { select: { id: true, name: true, code: true } }, students: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, phone: true } } } }, _count: { select: { students: true } } },
      });
      if (!guardian) throw new AppError("Guardian not found.", 404);
      return GuardianMapper.toDetail(guardian);
    }, 600);
  }

  async createGuardian(data: CreateGuardianDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const guardian = await prisma.$transaction(async (tx) => {
      const guardian = await tx.guardian.create({
        data: { branchId: data.branchId, fullName: data.fullName, relationship: data.relationship, phone: data.phone, alternativePhone: data.alternativePhone, email: data.email, occupation: data.occupation, address: data.address, nationalId: data.nationalId, telegramChatId: data.telegramChatId },
      });

      if (data.studentIds?.length) {
        const students = await tx.userProfile.findMany({ where: { id: { in: data.studentIds }, user: { role: { some: { role: { name: "STUDENT" } } } } } });
        if (students.length !== data.studentIds.length) throw new AppError("One or more students not found or don't have STUDENT role.", 404);
        await tx.studentGuardian.createMany({ data: data.studentIds.map((studentId, index) => ({ studentId, guardianId: guardian.id, isPrimary: index === 0 })) });
      }

      return tx.guardian.findUnique({ where: { id: guardian.id }, include: { branch: { select: { id: true, name: true, code: true } }, students: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, phone: true } } } }, _count: { select: { students: true } } } });
    });

    await CacheUtils.invalidatePattern('guardians:list:*');
    return GuardianMapper.toDetail(guardian!);
  }

  async updateGuardian(id: string, data: UpdateGuardianDto) {
    const guardian = await prisma.guardian.findUnique({ where: { id } });
    if (!guardian) throw new AppError("Guardian not found.", 404);
    if (data.branchId) { const branch = await prisma.branch.findUnique({ where: { id: data.branchId } }); if (!branch) throw new AppError("Branch not found.", 404); }

    const updatedGuardian = await prisma.guardian.update({
      where: { id },
      data: { ...(data.fullName && { fullName: data.fullName }), ...(data.relationship && { relationship: data.relationship }), ...(data.phone !== undefined && { phone: data.phone }), ...(data.alternativePhone !== undefined && { alternativePhone: data.alternativePhone }), ...(data.email !== undefined && { email: data.email }), ...(data.occupation !== undefined && { occupation: data.occupation }), ...(data.address !== undefined && { address: data.address }), ...(data.nationalId !== undefined && { nationalId: data.nationalId }), ...(data.telegramChatId !== undefined && { telegramChatId: data.telegramChatId }), ...(data.branchId && { branchId: data.branchId }) },
      include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { students: true } } },
    });

    await Promise.all([CacheUtils.delete(`guardian:${id}`), CacheUtils.invalidatePattern('guardians:list:*')]);
    return GuardianMapper.toResponse(updatedGuardian);
  }

  async deleteGuardian(id: string) {
    const guardian = await prisma.guardian.findUnique({ where: { id }, include: { _count: { select: { students: true } } } });
    if (!guardian) throw new AppError("Guardian not found.", 404);
    await prisma.guardian.delete({ where: { id } });
    await Promise.all([CacheUtils.delete(`guardian:${id}`), CacheUtils.invalidatePattern('guardians:list:*')]);
    return { message: "Guardian deleted successfully." };
  }

  async linkGuardianToStudent(data: LinkGuardianToStudentDto) {
    const guardian = await prisma.guardian.findUnique({ where: { id: data.guardianId } });
    if (!guardian) throw new AppError("Guardian not found.", 404);

    const student = await prisma.userProfile.findUnique({ where: { id: data.studentId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!student) throw new AppError("Student not found.", 404);
    const hasStudentRole = student.user.role.some(r => r.role.name === "STUDENT");
    if (!hasStudentRole) throw new AppError("User does not have STUDENT role.", 400);

    const existingLink = await prisma.studentGuardian.findUnique({ where: { studentId_guardianId: { studentId: data.studentId, guardianId: data.guardianId } } });
    if (existingLink) throw new AppError("This guardian is already linked to this student.", 409);

    if (data.isPrimary) await prisma.studentGuardian.updateMany({ where: { studentId: data.studentId, isPrimary: true }, data: { isPrimary: false } });
    await prisma.studentGuardian.create({ data: { studentId: data.studentId, guardianId: data.guardianId, isPrimary: data.isPrimary ?? false } });

    await Promise.all([CacheUtils.delete(`guardian:${data.guardianId}`), CacheUtils.invalidatePattern('guardians:student:*')]);
    return this.getGuardianById(data.guardianId);
  }

  async unlinkGuardianFromStudent(guardianId: string, studentId: string) {
    const link = await prisma.studentGuardian.findUnique({ where: { studentId_guardianId: { studentId, guardianId } } });
    if (!link) throw new AppError("Guardian-student link not found.", 404);
    await prisma.studentGuardian.delete({ where: { studentId_guardianId: { studentId, guardianId } } });
    await Promise.all([CacheUtils.delete(`guardian:${guardianId}`), CacheUtils.invalidatePattern('guardians:student:*')]);
    return { message: "Guardian unlinked from student successfully." };
  }

  async getGuardiansByStudent(studentId: string) {
    return CacheUtils.getOrSet(`guardians:student:${studentId}`, async () => {
      const student = await prisma.userProfile.findUnique({ where: { id: studentId } });
      if (!student) throw new AppError("Student not found.", 404);
      const guardians = await prisma.guardian.findMany({ where: { students: { some: { studentId } } }, include: { branch: { select: { id: true, name: true, code: true } }, students: { where: { studentId }, select: { isPrimary: true } } }, orderBy: { fullName: "asc" } });
      return guardians.map(g => ({ ...GuardianMapper.toResponse(g), isPrimary: g.students[0]?.isPrimary || false }));
    }, 300);
  }

  async getMyGuardians(userId: string) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    return CacheUtils.getOrSet(`guardians:my:${studentProfile.id}`, async () => {
      const hasStudentRole = studentProfile.user.role.some(r => r.role.name === "STUDENT" || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
      if (!hasStudentRole) throw new AppError("You don't have a student role.", 403);

      const guardians = await prisma.guardian.findMany({ where: { students: { some: { studentId: studentProfile.id } } }, include: { branch: { select: { id: true, name: true, code: true } }, students: { where: { studentId: studentProfile.id }, select: { isPrimary: true } } }, orderBy: { fullName: "asc" } });

      return {
        student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber },
        guardians: guardians.map(g => ({ id: g.id, fullName: g.fullName, relationship: g.relationship, phone: g.phone, alternativePhone: g.alternativePhone, email: g.email, occupation: g.occupation, address: g.address, isPrimary: g.students[0]?.isPrimary || false })),
        summary: { totalGuardians: guardians.length, primaryGuardian: guardians.find(g => g.students[0]?.isPrimary)?.fullName || null },
      };
    }, 120);
  }

  async getGuardiansByTeacherClassrooms(teacherUserId: string, params?: { academicTermId?: string; classroomId?: string; search?: string }) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const hasTeacherRole = teacherProfile.user.role.some(r => r.role.name === SYSTEM_ROLES.TEACHER || r.role.name === SYSTEM_ROLES.ADMIN || r.role.name === SYSTEM_ROLES.SUPER_ADMIN);
    if (!hasTeacherRole) throw new AppError("You don't have a teaching role.", 403);

    const cacheKey = `guardians:teacher:${teacherProfile.id}:${params?.academicTermId || 'all'}:${params?.classroomId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const assignmentWhere: any = { teacherId: teacherProfile.id, ...(params?.academicTermId && { academicTermId: params.academicTermId }), ...(params?.classroomId && { classroomId: params.classroomId }) };
      const assignments = await prisma.teacherAssignment.findMany({ where: assignmentWhere, select: { id: true, classroomId: true, subjectId: true, classroom: { select: { id: true, name: true } }, subject: { select: { id: true, name: true, code: true } } } });
      const classroomIds = [...new Set(assignments.map(a => a.classroomId))];
      if (classroomIds.length === 0) return { teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber }, classrooms: [], summary: { totalClassrooms: 0, totalStudents: 0, totalGuardians: 0 } };

      const enrollments = await prisma.studentEnrollment.findMany({ where: { classroomId: { in: classroomIds }, isActive: true, ...(params?.academicTermId && { academicTermId: params.academicTermId }) }, include: { student: { select: { id: true, fullName: true, registrationNumber: true, phone: true, email: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } }, orderBy: [{ classroom: { name: "asc" } }, { student: { fullName: "asc" } }] });
      const studentIds = [...new Set(enrollments.map(e => e.studentId))];

      let filteredEnrollments = enrollments;
      if (params?.search) { const searchLower = params.search.toLowerCase(); filteredEnrollments = enrollments.filter(e => e.student.fullName.toLowerCase().includes(searchLower) || e.student.registrationNumber?.toLowerCase().includes(searchLower) || e.student.phone?.includes(searchLower)); }

      const studentGuardians = await prisma.studentGuardian.findMany({ where: { studentId: { in: studentIds } }, include: { guardian: { select: { id: true, fullName: true, relationship: true, phone: true, alternativePhone: true, email: true, occupation: true, address: true } } } });
      const guardiansByStudent: Record<string, any[]> = {};
      studentGuardians.forEach(sg => { if (!guardiansByStudent[sg.studentId]) guardiansByStudent[sg.studentId] = []; guardiansByStudent[sg.studentId].push({ id: sg.guardian.id, fullName: sg.guardian.fullName, relationship: sg.guardian.relationship, phone: sg.guardian.phone, alternativePhone: sg.guardian.alternativePhone, email: sg.guardian.email, isPrimary: sg.isPrimary }); });

      const classroomsMap: Record<string, any> = {};
      filteredEnrollments.forEach(enrollment => {
        const cId = enrollment.classroomId;
        if (!classroomsMap[cId]) classroomsMap[cId] = { classroom: { id: enrollment.classroom.id, name: enrollment.classroom.name }, subjects: assignments.filter(a => a.classroomId === cId).map(a => ({ id: a.subject.id, name: a.subject.name, code: a.subject.code })), students: [] };
        if (!classroomsMap[cId].students.some((s: any) => s.id === enrollment.student.id)) {
          classroomsMap[cId].students.push({ id: enrollment.student.id, fullName: enrollment.student.fullName, registrationNumber: enrollment.student.registrationNumber, phone: enrollment.student.phone, email: enrollment.student.email, photoUrl: enrollment.student.photoUrl, guardians: guardiansByStudent[enrollment.studentId] || [] });
        }
      });

      const classrooms = Object.values(classroomsMap);
      const totalStudents = classrooms.reduce((sum, c: any) => sum + c.students.length, 0);
      const totalGuardians = Object.values(guardiansByStudent).reduce((sum, g) => sum + g.length, 0);

      return { teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber }, classrooms, summary: { totalClassrooms: classrooms.length, totalStudents, totalGuardians } };
    }, 120);
  }
}

export const guardianService = new GuardianService();