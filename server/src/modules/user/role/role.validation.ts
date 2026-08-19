// src/modules/user/role/role.validation.ts
import { z } from "zod";

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role name must be less than 50 characters")
    .regex(
      /^[A-Z_]+$/,
      "Role name must be uppercase with underscores only (e.g., SUPER_ADMIN)"
    ),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
  permissionIds: z.array(z.string().cuid("Invalid permission ID")).optional(),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z_]+$/, "Role name must be uppercase with underscores only")
    .optional(),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string().cuid("Invalid permission ID")).optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;