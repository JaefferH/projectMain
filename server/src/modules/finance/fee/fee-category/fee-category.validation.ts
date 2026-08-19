import { z } from "zod";

export const createFeeCategorySchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(100, "Category name must be less than 100 characters"),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateFeeCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateFeeCategoryDto = z.infer<typeof createFeeCategorySchema>;
export type UpdateFeeCategoryDto = z.infer<typeof updateFeeCategorySchema>;