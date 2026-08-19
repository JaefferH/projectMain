// src/modules/user/permission/permission.routes.ts
import { Router } from "express";
import { permissionController } from "./permission.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { createPermissionSchema, updatePermissionSchema, bulkCreatePermissionSchema } from "./permission.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";
import { validate } from "@middleware/validate.middleware";

const router = Router();

router.use(authenticate);

// Get permission groups
router.get(
  "/groups",
  authorize("permission:read"),
  permissionController.getPermissionGroups
);

// Get all permissions
router.get(
  "/",
  authorize("permission:read"),
  permissionController.getPermissions
);

// Get permission by ID
router.get(
  "/:id",
  authorize("permission:read"),
  permissionController.getPermissionById
);

// Create permission (only SUPER_ADMIN)
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("permission:manage"),
  validate(createPermissionSchema),
  permissionController.createPermission
);

// Bulk create permissions
router.post(
  "/bulk",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("permission:manage"),
  validate(bulkCreatePermissionSchema),
  permissionController.bulkCreatePermissions
);

// Update permission
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("permission:manage"),
  validate(updatePermissionSchema),
  permissionController.updatePermission
);

// Delete permission
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("permission:manage"),
  permissionController.deletePermission
);

export default router;