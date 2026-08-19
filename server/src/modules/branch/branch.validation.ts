// src/modules/branch/branch.validation.ts
import { z } from "zod";

export const createBranchSchema = z.object({
  organizationId: z.string().cuid("Invalid organization ID"),
  name: z
    .string()
    .min(2, "Branch name must be at least 2 characters")
    .max(100, "Branch name must be less than 100 characters"),
  code: z
    .string()
    .min(2, "Branch code must be at least 2 characters")
    .max(20, "Branch code must be less than 20 characters")
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional().default("Ethiopia"),
  isMainCampus: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateBranchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9-]+$/, "Code must be uppercase letters, numbers, and hyphens only")
    .optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  country: z.string().optional(),
  isMainCampus: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateBranchDto = z.infer<typeof createBranchSchema>;
export type UpdateBranchDto = z.infer<typeof updateBranchSchema>;