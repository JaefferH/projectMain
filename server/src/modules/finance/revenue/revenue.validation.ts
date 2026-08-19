// src/modules/finance/revenue/revenue.validation.ts
import { z } from "zod";

export const createRevenueCategorySchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().max(500).optional(),
});

export const updateRevenueCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createRevenueSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  categoryId: z.string().cuid("Invalid category ID"),
  amount: z.number().positive("Amount must be positive"),
  receivedDate: z.string().datetime("Invalid date"),
  description: z.string().max(500).optional(),
  referenceNumber: z.string().optional(),
});

export const updateRevenueSchema = z.object({
  amount: z.number().positive().optional(),
  receivedDate: z.string().datetime().optional(),
  description: z.string().max(500).optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
});

export type CreateRevenueCategoryDto = z.infer<typeof createRevenueCategorySchema>;
export type UpdateRevenueCategoryDto = z.infer<typeof updateRevenueCategorySchema>;
export type CreateRevenueDto = z.infer<typeof createRevenueSchema>;
export type UpdateRevenueDto = z.infer<typeof updateRevenueSchema>;