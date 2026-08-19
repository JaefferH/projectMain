// src/modules/academic/academic-year/academic-year.validation.ts
import { z } from "zod";

export const createAcademicYearSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  name: z
    .string()
    .min(3, "Academic year name must be at least 3 characters")
    .max(50, "Academic year name must be less than 50 characters")
    .regex(/^\d{4}\/\d{4}$/, "Academic year name must be in format 'YYYY/YYYY' (e.g., '2024/2025')"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  isCurrent: z.boolean().optional().default(false),
});

export const updateAcademicYearSchema = z.object({
  name: z.string().min(3).max(50).regex(/^\d{4}\/\d{4}$/).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
});

export type CreateAcademicYearDto = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearDto = z.infer<typeof updateAcademicYearSchema>;