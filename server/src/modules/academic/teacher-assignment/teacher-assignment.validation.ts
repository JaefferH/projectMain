// src/modules/academic/teacher-assignment/teacher-assignment.validation.ts
import { z } from "zod";

export const createTeacherAssignmentSchema = z.object({
  teacherId: z.string().cuid("Invalid teacher ID"),
  subjectId: z.string().cuid("Invalid subject ID"),
  classroomId: z.string().cuid("Invalid classroom ID"),
  academicTermId: z.string().cuid("Invalid academic term ID"),
  weeklyPeriods: z.number().int().positive("Weekly periods must be a positive number").optional(),
});

export const updateTeacherAssignmentSchema = z.object({
  teacherId: z.string().cuid("Invalid teacher ID").optional(),
  subjectId: z.string().cuid("Invalid subject ID").optional(),
  classroomId: z.string().cuid("Invalid classroom ID").optional(),
  weeklyPeriods: z.number().int().positive().optional().nullable(),
});

export const bulkCreateTeacherAssignmentSchema = z.object({
  assignments: z.array(createTeacherAssignmentSchema).min(1, "At least one assignment is required"),
});

export type CreateTeacherAssignmentDto = z.infer<typeof createTeacherAssignmentSchema>;
export type UpdateTeacherAssignmentDto = z.infer<typeof updateTeacherAssignmentSchema>;
export type BulkCreateTeacherAssignmentDto = z.infer<typeof bulkCreateTeacherAssignmentSchema>;