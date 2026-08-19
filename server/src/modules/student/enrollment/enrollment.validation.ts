// src/modules/student/enrollment/enrollment.validation.ts
import { z } from "zod";

export const createEnrollmentSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  classroomId: z.string().cuid("Invalid classroom ID"),
  academicTermId: z.string().cuid("Invalid academic term ID"),
  enrollmentDate: z.string().datetime().optional(),
});

export const updateEnrollmentSchema = z.object({
  isActive: z.boolean().optional(),
  classroomId: z.string().cuid("Invalid classroom ID").optional(),
});

export const bulkEnrollSchema = z.object({
  enrollments: z.array(createEnrollmentSchema).min(1, "At least one enrollment is required"),
});

export type CreateEnrollmentDto = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentDto = z.infer<typeof updateEnrollmentSchema>;
export type BulkEnrollDto = z.infer<typeof bulkEnrollSchema>;