// src/modules/user/permission/permission.validation.ts
import { z } from "zod";

export const createPermissionSchema = z.object({
  name: z
    .string()
    .min(2, "Permission name must be at least 2 characters")
    .max(100, "Permission name must be less than 100 characters")
    .regex(
      /^[a-z_]+:[a-z_]+$/,
      "Permission name must be in format 'module:action' (e.g., 'user:create')"
    ),
  description: z.string().max(200, "Description must be less than 200 characters").optional(),
});

export const updatePermissionSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z_]+:[a-z_]+$/, "Permission name must be in format 'module:action'")
    .optional(),
  description: z.string().max(200).optional(),
});

export const bulkCreatePermissionSchema = z.object({
  permissions: z.array(createPermissionSchema).min(1, "At least one permission is required"),
});

export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionDto = z.infer<typeof updatePermissionSchema>;
export type BulkCreatePermissionDto = z.infer<typeof bulkCreatePermissionSchema>;