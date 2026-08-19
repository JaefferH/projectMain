// src/modules/attendance/staff/staff-attendance.validation.ts
import { z } from "zod";

export const createStaffAttendanceSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  checkInTime: z.string().datetime().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE", "EXCUSED"]),
  remarks: z.string().max(200).optional(),
});

export const updateStaffAttendanceSchema = z.object({
  checkOutTime: z.string().datetime().optional(),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "HALF_DAY", "ON_LEAVE", "EXCUSED"]).optional(),
  remarks: z.string().max(200).optional(),
});

export type CreateStaffAttendanceDto = z.infer<typeof createStaffAttendanceSchema>;
export type UpdateStaffAttendanceDto = z.infer<typeof updateStaffAttendanceSchema>;