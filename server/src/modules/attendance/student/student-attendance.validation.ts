// src/modules/attendance/student/student-attendance.validation.ts
import { z } from "zod";

export const createStudentAttendanceSessionSchema = z.object({
  classroomId: z.string().cuid("Invalid classroom ID"),
  academicTermId: z.string().cuid("Invalid academic term ID"),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  topic: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
  records: z.array(z.object({
    enrollmentId: z.string().cuid("Invalid enrollment ID"),
    status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED", "HALF_DAY"]),
    remarks: z.string().max(200).optional(),
    checkInTime: z.string().datetime().optional(),
  })).min(1, "At least one attendance record is required"),
});

export const updateStudentAttendanceRecordSchema = z.object({
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED", "HALF_DAY"]),
  remarks: z.string().max(200).optional(),
  checkInTime: z.string().datetime().optional(),
});

export const lockAttendanceSessionSchema = z.object({
  lockedBy: z.string().cuid().optional(),
});

export type CreateStudentAttendanceSessionDto = z.infer<typeof createStudentAttendanceSessionSchema>;
export type UpdateStudentAttendanceRecordDto = z.infer<typeof updateStudentAttendanceRecordSchema>;