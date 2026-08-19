// src/modules/academic/subject/subject.validation.ts
import { z } from "zod";

export const createSubjectSchema = z.object({
  organizationId: z.string().cuid("Invalid organization ID"),
  code: z
    .string()
    .min(2, "Subject code must be at least 2 characters")
    .max(20, "Subject code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
  name: z
    .string()
    .min(2, "Subject name must be at least 2 characters")
    .max(100, "Subject name must be less than 100 characters"),
  description: z.string().max(500).optional(),
  branchId: z.string().cuid("Invalid branch ID").optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateSubjectSchema = z.object({
  code: z.string().min(2).max(20).regex(/^[A-Z0-9-]+$/).optional(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  branchId: z.string().cuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
export type UpdateSubjectDto = z.infer<typeof updateSubjectSchema>;