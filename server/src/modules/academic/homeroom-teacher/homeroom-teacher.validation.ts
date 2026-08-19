// src/modules/academic/homeroom-teacher/homeroom-teacher.validation.ts
import { z } from "zod";

export const assignHomeroomTeacherSchema = z.object({
  teacherId: z.string().cuid("Invalid teacher ID"),
  classroomId: z.string().cuid("Invalid classroom ID"),
  academicTermId: z.string().cuid("Invalid academic term ID"),
});

export const updateHomeroomTeacherSchema = z.object({
  teacherId: z.string().cuid("Invalid teacher ID").optional(),
  isActive: z.boolean().optional(),
});

export type AssignHomeroomTeacherDto = z.infer<typeof assignHomeroomTeacherSchema>;
export type UpdateHomeroomTeacherDto = z.infer<typeof updateHomeroomTeacherSchema>;