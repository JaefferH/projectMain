// src/modules/user/user.routes.ts
import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { createUserSchema, updateUserSchema } from "./user.validation";
import { SYSTEM_ROLES } from "../../shared/constants/roles";
import { validate } from "@middleware/validate.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's permissions
router.get(
  "/permissions",
  userController.getUserPermissions
);

// Get all users (with optional filters)
router.get(
  "/",
  authorize("user:read"),
  userController.getUsers
);

// Get user by ID
router.get(
  "/:id",
  authorize("user:read"),
  userController.getUserById
);
// Create new user
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("user:create"),
  validate(createUserSchema),
  userController.createUser
);

// Update user
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("user:update"),
  validate(updateUserSchema),
  userController.updateUser
);

// Soft delete user (deactivate)
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("user:delete"),
  userController.deleteUser
);

// Hard delete user (permanent - SUPER_ADMIN only)
router.delete(
  "/:id/permanent",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  userController.hardDeleteUser
);

// Restore user (reactivate)
router.patch(
  "/:id/restore",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("user:update"),
  userController.restoreUser
);

// Bulk operations (ADMIN and above)
router.post(
  "/bulk/delete",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("user:delete"),
  userController.bulkDeleteUsers
);

router.post(
  "/bulk/permanent-delete",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  userController.bulkHardDeleteUsers
);

export default router;