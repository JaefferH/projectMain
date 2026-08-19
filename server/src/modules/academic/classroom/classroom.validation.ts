// src/modules/academic/classroom/classroom.validation.ts
import { z } from "zod";

export const createClassroomSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  academicYearId: z.string().cuid("Invalid academic year ID"),
  name: z
    .string()
    .min(1, "Classroom name is required")
    .max(50, "Classroom name must be less than 50 characters"),
  capacity: z.number().int().positive("Capacity must be a positive number").optional(),
});

export const updateClassroomSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  capacity: z.number().int().positive().optional(),
  academicYearId: z.string().cuid("Invalid academic year ID").optional(),
});

export type CreateClassroomDto = z.infer<typeof createClassroomSchema>;
export type UpdateClassroomDto = z.infer<typeof updateClassroomSchema>;