// src/modules/attendance/staff/staff-attendance.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { StaffAttendanceMapper } from "./staff-attendance.mapper";
import { CreateStaffAttendanceDto, UpdateStaffAttendanceDto } from "./staff-attendance.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class StaffAttendanceService {
  async getStaffAttendance(params: {
    branchId?: string; startDate?: string; endDate?: string; status?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `staffAttendance:list:${page}:${limit}:${params.branchId || 'all'}:${params.startDate || 'all'}:${params.endDate || 'all'}:${params.status || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.status && { status: params.status }),
        ...(params.startDate && params.endDate && { attendanceDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }),
      };

      const [records, total] = await prisma.$transaction([
        prisma.staffAttendanceRecord.findMany({
          where, skip, take: limit,
          include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } } },
          orderBy: { attendanceDate: "desc" },
        }),
        prisma.staffAttendanceRecord.count({ where }),
      ]);

      return { items: StaffAttendanceMapper.toList(records), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async checkIn(userId: string, data: CreateStaffAttendanceDto) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError("Staff profile not found.", 404);

    const attendanceDate = new Date(data.attendanceDate);
    const existingRecord = await prisma.staffAttendanceRecord.findFirst({ where: { profileId: profile.id, attendanceDate } });
    if (existingRecord) throw new AppError("You have already recorded attendance for this date.", 409);

    const record = await prisma.staffAttendanceRecord.create({
      data: { userId, profileId: profile.id, branchId: data.branchId, attendanceDate, checkInTime: data.checkInTime ? new Date(data.checkInTime) : new Date(), status: data.status as any, remarks: data.remarks },
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } } },
    });

    // Invalidate staff attendance list and my attendance caches
    await Promise.all([
      CacheUtils.invalidatePattern('staffAttendance:list:*'),
      CacheUtils.delete(`staffAttendance:my:${profile.id}`),
      CacheUtils.invalidatePattern('dashboard:*'),
    ]);

    return StaffAttendanceMapper.toResponse(record);
  }

  async checkOut(userId: string, attendanceDate: string) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError("Staff profile not found.", 404);

    const record = await prisma.staffAttendanceRecord.findFirst({ where: { profileId: profile.id, attendanceDate: new Date(attendanceDate) } });
    if (!record) throw new AppError("No attendance record found for this date. Check in first.", 404);
    if (record.isLocked) throw new AppError("Attendance record is locked and cannot be modified.", 400);
    if (record.checkOutTime) throw new AppError("You have already checked out for this date.", 409);

    const updatedRecord = await prisma.staffAttendanceRecord.update({
      where: { id: record.id },
      data: { checkOutTime: new Date(), isLocked: true },
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } } },
    });

    await Promise.all([
      CacheUtils.invalidatePattern('staffAttendance:list:*'),
      CacheUtils.delete(`staffAttendance:my:${profile.id}`),
      CacheUtils.invalidatePattern('dashboard:*'),
    ]);

    return StaffAttendanceMapper.toResponse(updatedRecord);
  }

  async getMyAttendance(userId: string, params?: { startDate?: string; endDate?: string }) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError("Staff profile not found.", 404);

    const cacheKey = `staffAttendance:my:${profile.id}:${params?.startDate || 'all'}:${params?.endDate || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { profileId: profile.id };
      if (params?.startDate && params?.endDate) {
        where.attendanceDate = { gte: new Date(params.startDate), lte: new Date(params.endDate) };
      }

      const records = await prisma.staffAttendanceRecord.findMany({
        where, include: { branch: { select: { id: true, name: true } } }, orderBy: { attendanceDate: "desc" },
      });

      const summary = {
        present: records.filter(r => r.status === "PRESENT").length,
        absent: records.filter(r => r.status === "ABSENT").length,
        late: records.filter(r => r.status === "LATE").length,
        onLeave: records.filter(r => r.status === "ON_LEAVE").length,
        total: records.length,
      };

      return {
        staff: { id: profile.id, fullName: profile.fullName, employeeNumber: profile.employeeNumber },
        records: StaffAttendanceMapper.toList(records),
        summary,
        attendancePercentage: summary.total > 0 ? Math.round(((summary.present + summary.late) / summary.total) * 100) : 0,
      };
    }, 120);
  }

  async updateStaffAttendance(recordId: string, data: UpdateStaffAttendanceDto) {
    const record = await prisma.staffAttendanceRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new AppError("Attendance record not found.", 404);

    const updateData: any = {};
    if (data.checkOutTime) updateData.checkOutTime = new Date(data.checkOutTime);
    if (data.status) updateData.status = data.status;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;

    const updatedRecord = await prisma.staffAttendanceRecord.update({
      where: { id: recordId }, data: updateData,
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } } },
    });

    await Promise.all([
      CacheUtils.invalidatePattern('staffAttendance:list:*'),
      CacheUtils.delete(`staffAttendance:my:${record.profileId}`),
      CacheUtils.invalidatePattern('dashboard:*'),
    ]);

    return StaffAttendanceMapper.toResponse(updatedRecord);
  }
}

export const staffAttendanceService = new StaffAttendanceService();