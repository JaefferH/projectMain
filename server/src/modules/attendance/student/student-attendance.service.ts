// src/modules/attendance/student/student-attendance.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { StudentAttendanceMapper } from "./student-attendance.mapper";
import { CreateStudentAttendanceSessionDto, UpdateStudentAttendanceRecordDto } from "./student-attendance.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class StudentAttendanceService {
  async getAttendanceSessions(params: {
    classroomId?: string; academicTermId?: string; startDate?: string; endDate?: string;
    isLocked?: boolean; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 10;
    const cacheKey = `studentAttendance:sessions:${page}:${limit}:${params.classroomId || 'all'}:${params.academicTermId || 'all'}:${params.isLocked ?? 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.classroomId && { classroomId: params.classroomId }),
        ...(params.academicTermId && { academicTermId: params.academicTermId }),
        ...(params.isLocked !== undefined && { isLocked: params.isLocked }),
        ...(params.startDate && params.endDate && { sessionDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }),
      };

      const [sessions, total] = await prisma.$transaction([
        prisma.studentAttendanceSession.findMany({
          where, skip, take: limit,
          include: {
            homeroomTeacher: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
            classroom: { select: { id: true, name: true } },
            academicTerm: { include: { academicYear: { select: { id: true, name: true } } } },
            _count: { select: { records: true } },
          },
          orderBy: { sessionDate: "desc" },
        }),
        prisma.studentAttendanceSession.count({ where }),
      ]);

      return { items: StudentAttendanceMapper.toSessionList(sessions), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async getAttendanceSessionById(id: string) {
    return CacheUtils.getOrSet(`studentAttendance:session:${id}`, async () => {
      const session = await prisma.studentAttendanceSession.findUnique({
        where: { id },
        include: {
          homeroomTeacher: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
          classroom: { select: { id: true, name: true } },
          academicTerm: { include: { academicYear: { select: { id: true, name: true } } } },
          records: { include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
        },
      });
      if (!session) throw new AppError("Attendance session not found.", 404);
      return { ...StudentAttendanceMapper.toSessionResponse(session), records: StudentAttendanceMapper.toRecordList(session.records) };
    }, 300);
  }

  async createAttendanceSession(teacherUserId: string, data: CreateStudentAttendanceSessionDto) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const homeroomTeacher = await prisma.homeroomTeacher.findFirst({
      where: { teacherId: teacherProfile.id, classroomId: data.classroomId, academicTermId: data.academicTermId, isActive: true },
      include: { classroom: true, academicTerm: true },
    });
    if (!homeroomTeacher) throw new AppError("You are not the homeroom teacher for this classroom in this term.", 403);

    const sessionDate = new Date(data.sessionDate);
    const existingSession = await prisma.studentAttendanceSession.findFirst({ where: { classroomId: data.classroomId, sessionDate } });
    if (existingSession) throw new AppError("Attendance session already exists for this classroom on this date.", 409);

    const enrollmentIds = data.records.map(r => r.enrollmentId);
    const enrollments = await prisma.studentEnrollment.findMany({ where: { id: { in: enrollmentIds }, classroomId: data.classroomId, isActive: true } });
    if (enrollments.length !== enrollmentIds.length) throw new AppError("One or more enrollment IDs are invalid or not in this classroom.", 400);

    const session = await prisma.studentAttendanceSession.create({
      data: {
        homeroomTeacherId: homeroomTeacher.id, classroomId: data.classroomId, academicTermId: data.academicTermId,
        sessionDate, topic: data.topic, notes: data.notes,
        records: { create: data.records.map(record => ({ enrollmentId: record.enrollmentId, status: record.status as any, remarks: record.remarks, checkInTime: record.checkInTime ? new Date(record.checkInTime) : null })) },
      },
      include: {
        homeroomTeacher: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
        classroom: { select: { id: true, name: true } },
        academicTerm: { include: { academicYear: { select: { id: true, name: true } } } },
        records: { include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
      },
    });

    await this.invalidateAttendanceCaches(data.classroomId);
    return { ...StudentAttendanceMapper.toSessionResponse(session), records: StudentAttendanceMapper.toRecordList(session.records) };
  }

  async updateAttendanceRecord(sessionId: string, recordId: string, data: UpdateStudentAttendanceRecordDto) {
    const session = await prisma.studentAttendanceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError("Attendance session not found.", 404);
    if (session.isLocked) throw new AppError("Cannot update attendance records for a locked session.", 400);

    const record = await prisma.studentAttendanceRecord.findFirst({ where: { id: recordId, attendanceSessionId: sessionId } });
    if (!record) throw new AppError("Attendance record not found.", 404);

    const updatedRecord = await prisma.studentAttendanceRecord.update({
      where: { id: recordId },
      data: { status: data.status as any, remarks: data.remarks, checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined },
      include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } },
    });

    await CacheUtils.delete(`studentAttendance:session:${sessionId}`);
    return StudentAttendanceMapper.toRecordResponse(updatedRecord);
  }

  async lockAttendanceSession(sessionId: string, userId: string) {
    const session = await prisma.studentAttendanceSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new AppError("Attendance session not found.", 404);
    if (session.isLocked) throw new AppError("Attendance session is already locked.", 400);

    const updatedSession = await prisma.studentAttendanceSession.update({
      where: { id: sessionId },
      data: { isLocked: true, lockedAt: new Date(), lockedBy: userId },
      include: {
        homeroomTeacher: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
        classroom: { select: { id: true, name: true } },
        academicTerm: { include: { academicYear: { select: { id: true, name: true } } } },
        records: { include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
      },
    });

    await CacheUtils.invalidatePattern('studentAttendance:*');
    return { ...StudentAttendanceMapper.toSessionResponse(updatedSession), records: StudentAttendanceMapper.toRecordList(updatedSession.records) };
  }

  async getMyAttendance(userId: string, params?: { academicTermId?: string; startDate?: string; endDate?: string }) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const cacheKey = `studentAttendance:my:${studentProfile.id}:${params?.academicTermId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const enrollmentWhere: any = { studentId: studentProfile.id, isActive: true, ...(params?.academicTermId && { academicTermId: params.academicTermId }) };
      const enrollment = await prisma.studentEnrollment.findFirst({ where: enrollmentWhere, include: { classroom: { select: { id: true, name: true } }, academicTerm: { include: { academicYear: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" } });

      if (!enrollment) return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, hasEnrollment: false, records: [], summary: { present: 0, absent: 0, late: 0, excused: 0, total: 0 } };

      const recordsWhere: any = { enrollmentId: enrollment.id };
      if (params?.startDate && params?.endDate) recordsWhere.attendanceSession = { sessionDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } };

      const records = await prisma.studentAttendanceRecord.findMany({ where: recordsWhere, include: { attendanceSession: { select: { id: true, sessionDate: true, topic: true } } }, orderBy: { attendanceSession: { sessionDate: "desc" } } });

      const summary = { present: records.filter(r => r.status === "PRESENT").length, absent: records.filter(r => r.status === "ABSENT").length, late: records.filter(r => r.status === "LATE").length, excused: records.filter(r => r.status === "EXCUSED").length, total: records.length };

      return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, hasEnrollment: true, classroom: enrollment.classroom, academicTerm: enrollment.academicTerm, records: records.map(r => ({ id: r.id, date: r.attendanceSession.sessionDate, status: r.status, topic: r.attendanceSession.topic, remarks: r.remarks })), summary, attendancePercentage: summary.total > 0 ? Math.round((summary.present / summary.total) * 100) : 0 };
    }, 120);
  }

  async getMyAttendanceSessions(teacherUserId: string, params?: { academicTermId?: string; startDate?: string; endDate?: string; includeRecords?: boolean; page?: number; limit?: number }) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const page = params?.page ?? 1; const limit = params?.limit ?? 10;
    const includeRecords = params?.includeRecords ?? true;
    const cacheKey = `studentAttendance:mySessions:${teacherProfile.id}:${page}:${limit}:${params?.academicTermId || 'all'}:${includeRecords}`;

    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const homeroomWhere: any = { teacherId: teacherProfile.id, isActive: true };
      if (params?.academicTermId) homeroomWhere.academicTermId = params.academicTermId;

      const homeroomAssignment = await prisma.homeroomTeacher.findFirst({
        where: homeroomWhere,
        include: { classroom: { select: { id: true, name: true } }, academicTerm: { include: { academicYear: { select: { id: true, name: true } } } } },
        orderBy: { createdAt: "desc" },
      });

      if (!homeroomAssignment) return { teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber }, hasHomeroomAssignment: false, message: "You are not assigned as a homeroom teacher for any class.", sessions: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } };

      const where: any = { homeroomTeacherId: homeroomAssignment.id };
      if (params?.startDate && params?.endDate) where.sessionDate = { gte: new Date(params.startDate), lte: new Date(params.endDate) };

      const [sessions, total] = await prisma.$transaction([
        prisma.studentAttendanceSession.findMany({
          where, skip, take: limit,
          include: {
            classroom: { select: { id: true, name: true } },
            academicTerm: { select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } } },
            _count: { select: { records: true } },
            ...(includeRecords && { records: { include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } } }),
          },
          orderBy: { sessionDate: "desc" },
        }),
        prisma.studentAttendanceSession.count({ where }),
      ]);

      return {
        teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber },
        hasHomeroomAssignment: true,
        homeroomAssignment: { id: homeroomAssignment.id, classroom: homeroomAssignment.classroom, academicTerm: { id: homeroomAssignment.academicTerm.id, name: homeroomAssignment.academicTerm.name, type: homeroomAssignment.academicTerm.type, academicYear: homeroomAssignment.academicTerm.academicYear } },
        sessions: sessions.map((session: any) => ({
          id: session.id, sessionDate: session.sessionDate, topic: session.topic, notes: session.notes, isLocked: session.isLocked, createdAt: session.createdAt,
          classroom: session.classroom, academicTerm: session.academicTerm,
          stats: { totalRecords: session.records?.length || session._count.records, present: session.records?.filter((r: any) => r.status === "PRESENT").length || 0, absent: session.records?.filter((r: any) => r.status === "ABSENT").length || 0, late: session.records?.filter((r: any) => r.status === "LATE").length || 0, excused: session.records?.filter((r: any) => r.status === "EXCUSED").length || 0, halfDay: session.records?.filter((r: any) => r.status === "HALF_DAY").length || 0 },
          records: includeRecords ? (session.records || []).map((record: any) => ({ id: record.id, enrollmentId: record.enrollmentId, status: record.status, remarks: record.remarks, checkInTime: record.checkInTime, student: record.enrollment?.student ? { id: record.enrollment.student.id, fullName: record.enrollment.student.fullName, registrationNumber: record.enrollment.student.registrationNumber, photoUrl: record.enrollment.student.photoUrl } : null })) : undefined,
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }, 120);
  }

  async getMyAttendanceSessionById(teacherUserId: string, sessionId: string) {
    return CacheUtils.getOrSet(`studentAttendance:mySession:${sessionId}:${teacherUserId}`, async () => {
      const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
      if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

      const session = await prisma.studentAttendanceSession.findUnique({
        where: { id: sessionId },
        include: {
          homeroomTeacher: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
          classroom: { select: { id: true, name: true } },
          academicTerm: { include: { academicYear: { select: { id: true, name: true } } } },
          records: { include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
        },
      });
      if (!session) throw new AppError("Attendance session not found.", 404);
      if (session.homeroomTeacher.teacherId !== teacherProfile.id) throw new AppError("You can only view your own attendance sessions.", 403);
      return { ...StudentAttendanceMapper.toSessionResponse(session), records: StudentAttendanceMapper.toRecordList(session.records) };
    }, 300);
  }

  async updateMyAttendanceRecord(teacherUserId: string, sessionId: string, recordId: string, data: UpdateStudentAttendanceRecordDto) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);
    const session = await prisma.studentAttendanceSession.findUnique({ where: { id: sessionId }, include: { homeroomTeacher: true } });
    if (!session) throw new AppError("Attendance session not found.", 404);
    if (session.homeroomTeacher.teacherId !== teacherProfile.id) throw new AppError("You can only update your own attendance sessions.", 403);
    if (session.isLocked) throw new AppError("Cannot update attendance records for a locked session.", 400);

    const record = await prisma.studentAttendanceRecord.findFirst({ where: { id: recordId, attendanceSessionId: sessionId } });
    if (!record) throw new AppError("Attendance record not found.", 404);

    const updatedRecord = await prisma.studentAttendanceRecord.update({
      where: { id: recordId }, data: { status: data.status as any, remarks: data.remarks, checkInTime: data.checkInTime ? new Date(data.checkInTime) : undefined },
      include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } },
    });

    await CacheUtils.delete(`studentAttendance:session:${sessionId}`);
    return StudentAttendanceMapper.toRecordResponse(updatedRecord);
  }

  async lockMyAttendanceSession(teacherUserId: string, sessionId: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);
    const session = await prisma.studentAttendanceSession.findUnique({ where: { id: sessionId }, include: { homeroomTeacher: true } });
    if (!session) throw new AppError("Attendance session not found.", 404);
    if (session.homeroomTeacher.teacherId !== teacherProfile.id) throw new AppError("You can only lock your own attendance sessions.", 403);
    if (session.isLocked) throw new AppError("Attendance session is already locked.", 400);

    const updatedSession = await prisma.studentAttendanceSession.update({
      where: { id: sessionId }, data: { isLocked: true, lockedAt: new Date(), lockedBy: teacherUserId },
      include: {
        homeroomTeacher: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
        classroom: { select: { id: true, name: true } },
        academicTerm: { include: { academicYear: { select: { id: true, name: true } } } },
        records: { include: { enrollment: { include: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
      },
    });

    await CacheUtils.invalidatePattern('studentAttendance:*');
    return { ...StudentAttendanceMapper.toSessionResponse(updatedSession), records: StudentAttendanceMapper.toRecordList(updatedSession.records) };
  }

  private async invalidateAttendanceCaches(classroomId: string) {
    await Promise.all([
      CacheUtils.invalidatePattern('studentAttendance:*'),
      CacheUtils.delete(`classroom:${classroomId}`),
      CacheUtils.invalidatePattern('dashboard:*'),
    ]);
  }
}

export const studentAttendanceService = new StudentAttendanceService();