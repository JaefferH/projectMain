// src/modules/organization/organization.validation.ts
import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),
  code: z
    .string()
    .min(2, "Organization code must be at least 2 characters")
    .max(20, "Organization code must be less than 20 characters")
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase letters, numbers, and underscores only"),
  logoUrl: z.string().url("Invalid logo URL").optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url("Invalid website URL").optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .optional(),
  code: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[A-Z0-9_]+$/, "Code must be uppercase letters, numbers, and underscores only")
    .optional(),
  logoUrl: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateOrganizationDto = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationDto = z.infer<typeof updateOrganizationSchema>;