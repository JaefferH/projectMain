// src/modules/schedule/timetable/timetable.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { TimetableMapper } from "./timetable.mapper";
import { CreateTimetableEntryDto, UpdateTimetableEntryDto, BulkCreateTimetableDto } from "./timetable.validation";
import { DayOfWeek } from "@prisma/client";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class TimetableService {
  async getTimetableEntries(params: {
    classroomId?: string; teacherAssignmentId?: string; schedulePeriodId?: string;
    dayOfWeek?: string; branchId?: string; academicTermId?: string; isActive?: boolean;
  }) {
    const cacheKey = `timetable:list:${params.classroomId || 'all'}:${params.teacherAssignmentId || 'all'}:${params.academicTermId || 'all'}:${params.dayOfWeek || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = {
        ...(params.classroomId && { classroomId: params.classroomId }),
        ...(params.teacherAssignmentId && { teacherAssignmentId: params.teacherAssignmentId }),
        ...(params.schedulePeriodId && { schedulePeriodId: params.schedulePeriodId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.branchId && { classroom: { branchId: params.branchId } }),
        ...(params.academicTermId && { teacherAssignment: { academicTermId: params.academicTermId } }),
      };
      if (params.dayOfWeek) where.dayOfWeek = params.dayOfWeek as DayOfWeek;

      const entries = await prisma.timetableEntry.findMany({
        where,
        include: {
          schedulePeriod: true,
          teacherAssignment: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } }, subject: { select: { id: true, name: true, code: true, description: true } } } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { schedulePeriod: { order: "asc" } }],
      });

      return TimetableMapper.toList(entries);
    }, 300);
  }

  async getTimetableEntryById(id: string) {
    return CacheUtils.getOrSet(`timetable:entry:${id}`, async () => {
      const entry = await prisma.timetableEntry.findUnique({
        where: { id },
        include: {
          schedulePeriod: true,
          teacherAssignment: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true } }, subject: { select: { id: true, name: true, code: true, description: true } } } },
          classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
        },
      });
      if (!entry) throw new AppError("Timetable entry not found.", 404);
      return TimetableMapper.toResponse(entry);
    }, 300);
  }

  async createTimetableEntry(data: CreateTimetableEntryDto) {
    const teacherAssignment = await prisma.teacherAssignment.findUnique({ where: { id: data.teacherAssignmentId }, include: { classroom: true, academicTerm: true, teacher: true, subject: true } });
    if (!teacherAssignment) throw new AppError("Teacher assignment not found.", 404);

    const schedulePeriod = await prisma.schedulePeriod.findUnique({ where: { id: data.schedulePeriodId } });
    if (!schedulePeriod) throw new AppError("Schedule period not found.", 404);
    if (schedulePeriod.isBreak) throw new AppError("Cannot schedule classes during break periods.", 400);

    const classroom = await prisma.classroom.findUnique({ where: { id: data.classroomId } });
    if (!classroom) throw new AppError("Classroom not found.", 404);
    if (teacherAssignment.classroomId !== data.classroomId) throw new AppError("Classroom does not match the teacher assignment's classroom.", 400);

    const dayOfWeekEnum = data.dayOfWeek as DayOfWeek;

    const existingTeacherEntry = await prisma.timetableEntry.findFirst({ where: { teacherAssignmentId: data.teacherAssignmentId, dayOfWeek: dayOfWeekEnum, schedulePeriodId: data.schedulePeriodId } });
    if (existingTeacherEntry) throw new AppError("This teacher is already scheduled for this subject during this period.", 409);

    const existingClassroomEntry = await prisma.timetableEntry.findFirst({ where: { classroomId: data.classroomId, dayOfWeek: dayOfWeekEnum, schedulePeriodId: data.schedulePeriodId, isActive: true } });
    if (existingClassroomEntry) throw new AppError("This classroom is already booked during this period.", 409);

    const existingTeacherPeriodEntry = await prisma.timetableEntry.findFirst({ where: { teacherAssignment: { teacherId: teacherAssignment.teacherId, academicTermId: teacherAssignment.academicTermId }, dayOfWeek: dayOfWeekEnum, schedulePeriodId: data.schedulePeriodId, isActive: true }, include: { teacherAssignment: { include: { subject: true } } } });
    if (existingTeacherPeriodEntry) throw new AppError(`This teacher is already scheduled for ${existingTeacherPeriodEntry.teacherAssignment.subject.name} during this period.`, 409);

    const entry = await prisma.timetableEntry.create({
      data: { teacherAssignmentId: data.teacherAssignmentId, schedulePeriodId: data.schedulePeriodId, classroomId: data.classroomId, dayOfWeek: dayOfWeekEnum, room: data.room },
      include: {
        schedulePeriod: true,
        teacherAssignment: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } }, subject: { select: { id: true, name: true, code: true, description: true } } } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
      },
    });

    await this.invalidateTimetableCaches(data.classroomId, teacherAssignment.teacherId);
    return TimetableMapper.toResponse(entry);
  }

  async bulkCreateTimetable(data: BulkCreateTimetableDto) {
    const results: { successful: any[]; failed: { entry: CreateTimetableEntryDto; error: string }[] } = { successful: [], failed: [] };
    for (const entryData of data.entries) {
      try { const result = await this.createTimetableEntry(entryData); results.successful.push(result); }
      catch (error: any) { results.failed.push({ entry: entryData, error: error.message }); }
    }
    return { message: `Created ${results.successful.length} entries, ${results.failed.length} failed`, ...results };
  }

  async updateTimetableEntry(id: string, data: UpdateTimetableEntryDto) {
    const entry = await prisma.timetableEntry.findUnique({ where: { id } });
    if (!entry) throw new AppError("Timetable entry not found.", 404);

    const schedulePeriodId = data.schedulePeriodId || entry.schedulePeriodId;
    const dayOfWeek = (data.dayOfWeek || entry.dayOfWeek) as DayOfWeek;
    const classroomId = data.classroomId || entry.classroomId;

    if (data.schedulePeriodId || data.dayOfWeek || data.classroomId) {
      const classroomConflict = await prisma.timetableEntry.findFirst({ where: { classroomId, dayOfWeek, schedulePeriodId, isActive: true, NOT: { id } } });
      if (classroomConflict) throw new AppError("This classroom is already booked during this period.", 409);
    }

    const updateData: any = {};
    if (data.teacherAssignmentId) updateData.teacherAssignmentId = data.teacherAssignmentId;
    if (data.schedulePeriodId) updateData.schedulePeriodId = data.schedulePeriodId;
    if (data.classroomId) updateData.classroomId = data.classroomId;
    if (data.dayOfWeek) updateData.dayOfWeek = data.dayOfWeek as DayOfWeek;
    if (data.room !== undefined) updateData.room = data.room;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedEntry = await prisma.timetableEntry.update({
      where: { id }, data: updateData,
      include: {
        schedulePeriod: true,
        teacherAssignment: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true } }, subject: { select: { id: true, name: true, code: true, description: true } } } },
        classroom: { select: { id: true, name: true, capacity: true, branch: { select: { id: true, name: true } } } },
      },
    });

    await this.invalidateTimetableCaches(updatedEntry.classroomId, updatedEntry.teacherAssignment?.teacherId, id);
    return TimetableMapper.toResponse(updatedEntry);
  }

  async deleteTimetableEntry(id: string) {
    const entry = await prisma.timetableEntry.findUnique({ where: { id }, include: { teacherAssignment: { select: { teacherId: true } } } });
    if (!entry) throw new AppError("Timetable entry not found.", 404);
    await prisma.timetableEntry.delete({ where: { id } });
    await this.invalidateTimetableCaches(entry.classroomId, entry.teacherAssignment?.teacherId, id, true);
    return { message: "Timetable entry deleted successfully." };
  }

  async getMyTimetable(userId: string, academicTermId?: string) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const cacheKey = `timetable:my:student:${studentProfile.id}:${academicTermId || 'current'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const enrollmentWhere: any = { studentId: studentProfile.id, isActive: true };
      if (academicTermId) enrollmentWhere.academicTermId = academicTermId;

      const enrollment = await prisma.studentEnrollment.findFirst({ where: enrollmentWhere, include: { classroom: { select: { id: true, name: true } }, academicTerm: { include: { academicYear: { select: { id: true, name: true } } } } }, orderBy: { createdAt: "desc" } });
      if (!enrollment) return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, hasTimetable: false, message: "You are not currently enrolled in any class.", timetable: null };

      const entries = await prisma.timetableEntry.findMany({
        where: { classroomId: enrollment.classroomId, teacherAssignment: { academicTermId: enrollment.academicTermId }, isActive: true },
        include: {
          schedulePeriod: true,
          teacherAssignment: { include: { teacher: { select: { id: true, fullName: true, employeeNumber: true, phone: true, email: true, photoUrl: true } }, subject: { select: { id: true, name: true, code: true, description: true } } } },
          classroom: { select: { id: true, name: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { schedulePeriod: { order: "asc" } }],
      });

      const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      const timetableByDay: Record<string, any[]> = {};
      daysOrder.forEach(day => { timetableByDay[day] = entries.filter(e => e.dayOfWeek === day).map(e => ({ id: e.id, dayOfWeek: e.dayOfWeek, period: { id: e.schedulePeriod.id, name: e.schedulePeriod.name, shortName: e.schedulePeriod.shortName, order: e.schedulePeriod.order, startTime: e.schedulePeriod.startTime, endTime: e.schedulePeriod.endTime, isBreak: e.schedulePeriod.isBreak }, subject: { id: e.teacherAssignment.subject.id, name: e.teacherAssignment.subject.name, code: e.teacherAssignment.subject.code, description: e.teacherAssignment.subject.description }, teacher: { id: e.teacherAssignment.teacher.id, fullName: e.teacherAssignment.teacher.fullName, employeeNumber: e.teacherAssignment.teacher.employeeNumber, phone: e.teacherAssignment.teacher.phone, email: e.teacherAssignment.teacher.email, photoUrl: e.teacherAssignment.teacher.photoUrl }, room: e.room })); });

      return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, hasTimetable: entries.length > 0, classroom: { id: enrollment.classroom.id, name: enrollment.classroom.name }, academicTerm: { id: enrollment.academicTerm.id, name: enrollment.academicTerm.name, type: enrollment.academicTerm.type, academicYear: enrollment.academicTerm.academicYear }, timetable: timetableByDay, summary: { totalPeriodsPerWeek: entries.length, uniqueSubjects: new Set(entries.map(e => e.teacherAssignment.subjectId)).size, uniqueTeachers: new Set(entries.map(e => e.teacherAssignment.teacherId)).size } };
    }, 120);
  }

  async getMyTeacherTimetable(userId: string, academicTermId?: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const cacheKey = `timetable:my:teacher:${teacherProfile.id}:${academicTermId || 'current'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { teacherAssignment: { teacherId: teacherProfile.id }, isActive: true };
      if (academicTermId) where.teacherAssignment.academicTermId = academicTermId;

      const entries = await prisma.timetableEntry.findMany({
        where,
        include: {
          schedulePeriod: true,
          teacherAssignment: { include: { subject: { select: { id: true, name: true, code: true, description: true } }, academicTerm: { include: { academicYear: { select: { id: true, name: true } } } } } },
          classroom: { select: { id: true, name: true, capacity: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { schedulePeriod: { order: "asc" } }],
      });

      const daysOrder = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      const timetableByDay: Record<string, any[]> = {};
      daysOrder.forEach(day => { timetableByDay[day] = entries.filter(e => e.dayOfWeek === day).map(e => ({ id: e.id, dayOfWeek: e.dayOfWeek, period: { id: e.schedulePeriod.id, name: e.schedulePeriod.name, shortName: e.schedulePeriod.shortName, order: e.schedulePeriod.order, startTime: e.schedulePeriod.startTime, endTime: e.schedulePeriod.endTime }, subject: { id: e.teacherAssignment.subject.id, name: e.teacherAssignment.subject.name, code: e.teacherAssignment.subject.code, description: e.teacherAssignment.subject.description }, classroom: { id: e.classroom.id, name: e.classroom.name, capacity: e.classroom.capacity }, room: e.room })); });

      const academicTerms = [...new Set(entries.map(e => e.teacherAssignment.academicTerm))].filter(Boolean).map(term => ({ id: term!.id, name: term!.name, academicYear: term!.academicYear }));

      return { teacher: { id: teacherProfile.id, fullName: teacherProfile.fullName, employeeNumber: teacherProfile.employeeNumber }, hasTimetable: entries.length > 0, academicTerms, timetable: timetableByDay, summary: { totalPeriodsPerWeek: entries.length, uniqueSubjects: new Set(entries.map(e => e.teacherAssignment.subjectId)).size, uniqueClassrooms: new Set(entries.map(e => e.classroomId)).size } };
    }, 120);
  }

  private async invalidateTimetableCaches(classroomId: string, teacherId?: string, entryId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'timetable:list:*',
      'timetable:my:*',
      `schedulePeriods:*`,
    ];
    if (entryId) keysToDelete.push(`timetable:entry:${entryId}`);
    if (classroomId) keysToDelete.push(`timetable:classroom:${classroomId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const timetableService = new TimetableService();