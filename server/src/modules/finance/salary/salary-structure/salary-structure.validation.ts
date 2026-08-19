// src/modules/finance/salary/salary-structure/salary-structure.validation.ts
import { z } from "zod";

export const createSalaryStructureSchema = z.object({
  profileId: z.string().cuid("Invalid staff profile ID"),
  branchId: z.string().cuid("Invalid branch ID"),
  basicSalary: z.number().positive("Basic salary must be positive"),
  currency: z.string().default("ETB"),
  effectiveFrom: z.string().datetime("Invalid effective date"),
  components: z.array(z.object({
    type: z.enum(["BASE_SALARY", "BONUS", "DEDUCTION", "OVERTIME", "ALLOWANCE", "TAX", "PENSION", "OTHER"]),
    name: z.string().min(2, "Component name is required").max(100),
    amount: z.number(),
    isPercentage: z.boolean().optional().default(false),
  })).optional(),
});

export const updateSalaryStructureSchema = z.object({
  basicSalary: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  effectiveTo: z.string().datetime().optional().nullable(),
  components: z.array(z.object({
    type: z.enum(["BASE_SALARY", "BONUS", "DEDUCTION", "OVERTIME", "ALLOWANCE", "TAX", "PENSION", "OTHER"]),
    name: z.string().min(2).max(100),
    amount: z.number(),
    isPercentage: z.boolean().optional().default(false),
  })).optional(),
});

export type CreateSalaryStructureDto = z.infer<typeof createSalaryStructureSchema>;
export type UpdateSalaryStructureDto = z.infer<typeof updateSalaryStructureSchema>;