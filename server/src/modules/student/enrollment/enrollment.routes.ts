// src/modules/student/enrollment/enrollment.routes.ts
import { Router } from "express";
import { enrollmentController } from "./enrollment.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createEnrollmentSchema, 
  updateEnrollmentSchema, 
  bulkEnrollSchema 
} from "./enrollment.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

// Get current student's enrollments
router.get(
  "/my-enrollments",
  enrollmentController.getMyEnrollments
);

// Get teacher's class enrollments
router.get(
  "/my-class-enrollments",
  enrollmentController.getMyClassEnrollments
);

// Get all enrollments
router.get(
  "/",
  authorize("student:read"),
  enrollmentController.getEnrollments
);

// Get enrollment by ID
router.get(
  "/:id",
  authorize("student:read"),
  enrollmentController.getEnrollmentById
);

// Create enrollment
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:create"),
  validate(createEnrollmentSchema),
  enrollmentController.createEnrollment
);

// Bulk enroll students
router.post(
  "/bulk",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:create"),
  validate(bulkEnrollSchema),
  enrollmentController.bulkEnrollStudents
);

// Update enrollment
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:update"),
  validate(updateEnrollmentSchema),
  enrollmentController.updateEnrollment
);

// Delete enrollment
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("student:delete"),
  enrollmentController.deleteEnrollment
);

export default router;