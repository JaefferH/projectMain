// src/modules/academic/academic-term/academic-term.validation.ts
import { z } from "zod";
import { AcademicTermType } from "@prisma/client";

export const createAcademicTermSchema = z.object({
  academicYearId: z.string().cuid("Invalid academic year ID"),
  name: z.string().min(2, "Term name must be at least 2 characters").max(50),
  type: z.nativeEnum(AcademicTermType),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  isCurrent: z.boolean().optional().default(false),
});

export const updateAcademicTermSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  type: z.nativeEnum(AcademicTermType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isCurrent: z.boolean().optional(),
});

export type CreateAcademicTermDto = z.infer<typeof createAcademicTermSchema>;
export type UpdateAcademicTermDto = z.infer<typeof updateAcademicTermSchema>;