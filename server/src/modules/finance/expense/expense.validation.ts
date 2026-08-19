// src/modules/finance/expense/expense.validation.ts
import { z } from "zod";

export const createExpenseCategorySchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export const updateExpenseCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createExpenseSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  categoryId: z.string().cuid("Invalid category ID"),
  amount: z.number().positive("Amount must be positive"),
  expenseDate: z.string().datetime("Invalid date"),
  description: z.string().max(500).optional(),
  referenceNumber: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  expenseDate: z.string().datetime().optional(),
  description: z.string().max(500).optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export const approveExpenseSchema = z.object({
  notes: z.string().max(200).optional(),
});

export const rejectExpenseSchema = z.object({
  notes: z.string().min(2, "Rejection reason is required").max(500),
});

export type CreateExpenseCategoryDto = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryDto = z.infer<typeof updateExpenseCategorySchema>;
export type CreateExpenseDto = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof updateExpenseSchema>;
export type ApproveExpenseDto = z.infer<typeof approveExpenseSchema>;
export type RejectExpenseDto = z.infer<typeof rejectExpenseSchema>;