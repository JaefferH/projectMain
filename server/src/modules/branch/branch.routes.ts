// src/modules/branch/branch.routes.ts
import { Router } from "express";
import { branchController } from "./branch.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { createBranchSchema, updateBranchSchema } from "./branch.validation";
import { SYSTEM_ROLES } from "../../shared/constants/roles";
import { validate } from "@middleware/validate.middleware";

const router = Router();

router.use(authenticate);

// Get branches by organization (specific route first)
router.get(
  "/organization/:organizationId",
  authorize("branch:read"),
  branchController.getBranchesByOrganization
);

// Get all branches
router.get(
  "/",
  authorize("branch:read"),
  branchController.getBranches
);

// Get branch by ID
router.get(
  "/:id",
  authorize("branch:read"),
  branchController.getBranchById
);

// Create branch (ADMIN and above)
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("branch:create"),
  validate(createBranchSchema),
  branchController.createBranch
);

// Update branch
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("branch:update"),
  validate(updateBranchSchema),
  branchController.updateBranch
);

/// Soft delete branch (deactivate)
router.patch(
  "/:id/soft-delete",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("branch:delete"),
  branchController.softDeleteBranch
);

// Delete branch with reassignment
router.post(
  "/:id/delete-with-reassign",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("branch:delete"),
  branchController.deleteBranchWithReassign
);

// Delete branch (SUPER_ADMIN only)
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("branch:delete"),
  branchController.deleteBranch
);

// Toggle branch status
router.patch(
  "/:id/toggle-status",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("branch:update"),
  branchController.toggleBranchStatus
);

export default router;