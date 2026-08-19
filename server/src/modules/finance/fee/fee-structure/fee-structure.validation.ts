// src/modules/finance/fee/fee-structure/fee-structure.validation.ts
import { z } from "zod";

export const createFeeStructureSchema = z.object({
  academicYearId: z.string().cuid("Invalid academic year ID"),
  feeCategoryId: z.string().cuid("Invalid fee category ID"),
  amount: z.number().positive("Amount must be positive"),
  dueDate: z.string().datetime().optional(),
  isOptional: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.enum(["MONTHLY", "TERMLY", "YEARLY"]).optional(),
});

export const updateFeeStructureSchema = z.object({
  amount: z.number().positive().optional(),
  dueDate: z.string().datetime().optional().nullable(),
  isOptional: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(["MONTHLY", "TERMLY", "YEARLY"]).optional().nullable(),
});

export const bulkCreateFeeStructureSchema = z.object({
  academicYearId: z.string().cuid("Invalid academic year ID"),
  feeCategoryId: z.string().cuid("Invalid fee category ID"),
  structures: z.array(z.object({
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional(),
    isOptional: z.boolean().optional().default(false),
    isRecurring: z.boolean().optional().default(false),
    recurringInterval: z.enum(["MONTHLY", "TERMLY", "YEARLY"]).optional(),
    // For bulk, we can specify different categories
    feeCategoryId: z.string().cuid("Invalid fee category ID").optional(),
  })).min(1, "At least one structure is required"),
});

export type CreateFeeStructureDto = z.infer<typeof createFeeStructureSchema>;
export type UpdateFeeStructureDto = z.infer<typeof updateFeeStructureSchema>;
export type BulkCreateFeeStructureDto = z.infer<typeof bulkCreateFeeStructureSchema>;