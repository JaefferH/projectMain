// src/modules/user/role/role.routes.ts
import { Router } from "express";
import { roleController } from "./role.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { createRoleSchema, updateRoleSchema } from "./role.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";
import { validate } from "@middleware/validate.middleware";

const router = Router();

router.use(authenticate);

// Get all roles
router.get(
  "/",
  authorize("role:read"),
  roleController.getRoles
);

// Get role by ID
router.get(
  "/:id",
  authorize("role:read"),
  roleController.getRoleById
);

// Get role users
router.get(
  "/:id/users",
  authorize("role:read"),
  roleController.getRoleUsers
);

// Create role (only SUPER_ADMIN)
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("role:create"),
  validate(createRoleSchema),
  roleController.createRole
);

// Update role (only SUPER_ADMIN)
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("role:update"),
  validate(updateRoleSchema),
  roleController.updateRole
);

// Delete role (only SUPER_ADMIN)
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("role:delete"),
  roleController.deleteRole
);

// Assign permissions to role
router.post(
  "/:id/permissions",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("permission:manage"),
  roleController.assignPermissionsToRole
);

// Remove permission from role
router.delete(
  "/:id/permissions/:permissionId",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("permission:manage"),
  roleController.removePermissionFromRole
);

export default router;