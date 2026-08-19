// src/modules/student/guardian/guardian.routes.ts
import { Router } from "express";
import { guardianController } from "./guardian.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createGuardianSchema, 
  updateGuardianSchema, 
  linkGuardianToStudentSchema 
} from "./guardian.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

// Get current student's own guardians
router.get(
  "/my-guardians",
  guardianController.getMyGuardians
);

// Get guardians/students for teacher's assigned classes
router.get(
  "/my-classes-students",
  guardianController.getGuardiansByMyClasses
);

// Get guardians by student
router.get(
  "/student/:studentId",
  authorize("student:read"),
  guardianController.getGuardiansByStudent
);

// Get all guardians
router.get(
  "/",
  authorize("student:read"),
  guardianController.getGuardians
);

// Get guardian by ID
router.get(
  "/:id",
  authorize("student:read"),
  guardianController.getGuardianById
);

// Create guardian
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:create"),
  validate(createGuardianSchema),
  guardianController.createGuardian
);

// Update guardian
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:update"),
  validate(updateGuardianSchema),
  guardianController.updateGuardian
);

// Delete guardian
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:delete"),
  guardianController.deleteGuardian
);

// Link guardian to student
router.post(
  "/link",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:update"),
  validate(linkGuardianToStudentSchema),
  guardianController.linkGuardianToStudent
);

// Unlink guardian from student
router.delete(
  "/:guardianId/unlink/:studentId",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:update"),
  guardianController.unlinkGuardianFromStudent
);

export default router;