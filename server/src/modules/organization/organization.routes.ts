// src/modules/organization/organization.routes.ts
import { Router } from "express";
import { organizationController } from "./organization.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { createOrganizationSchema, updateOrganizationSchema } from "./organization.validation";
import { SYSTEM_ROLES } from "../../shared/constants/roles";
import { validate } from "@middleware/validate.middleware";

const router = Router();

router.use(authenticate);

// SUPER_ADMIN and ADMIN can view organizations
router.get(
  "/",
  authorize("org:read"),
  organizationController.getOrganizations
);

router.get(
  "/:id",
  authorize("org:read"),
  organizationController.getOrganizationById
);

// Only SUPER_ADMIN can create organizations
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("org:create"),
  validate(createOrganizationSchema),
  organizationController.createOrganization
);

// Only SUPER_ADMIN can update organizations
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("org:update"),
  validate(updateOrganizationSchema),
  organizationController.updateOrganization
);

// Only SUPER_ADMIN can delete organizations
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("org:delete"),
  organizationController.deleteOrganization
);

// Toggle organization status
router.patch(
  "/:id/toggle-status",
  requireMinRole(SYSTEM_ROLES.SUPER_ADMIN),
  authorize("org:update"),
  organizationController.toggleOrganizationStatus
);

export default router;