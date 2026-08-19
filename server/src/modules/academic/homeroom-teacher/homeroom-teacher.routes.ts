// src/modules/academic/homeroom-teacher/homeroom-teacher.routes.ts
import { Router } from "express";
import { homeroomTeacherController } from "./homeroom-teacher.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { assignHomeroomTeacherSchema, updateHomeroomTeacherSchema } from "./homeroom-teacher.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

// Get current student's homeroom teacher
router.get(
  "/my-homeroom-teacher",
  homeroomTeacherController.getMyHomeroomTeacher
);

// Get current teacher's own homeroom assignment
router.get(
  "/my-homeroom",
  homeroomTeacherController.getMyHomeroomAssignment
);

// Get homeroom teacher for a specific classroom and term
router.get(
  "/classroom/:classroomId/term/:academicTermId",
  authorize("academic:read"),
  homeroomTeacherController.getHomeroomTeacherByClassroom
);

// Get all homeroom teachers
router.get(
  "/",
  authorize("academic:read"),
  homeroomTeacherController.getHomeroomTeachers
);

// Get homeroom teacher by ID
router.get(
  "/:id",
  authorize("academic:read"),
  homeroomTeacherController.getHomeroomTeacherById
);

// Assign homeroom teacher
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(assignHomeroomTeacherSchema),
  homeroomTeacherController.assignHomeroomTeacher
);

// Update homeroom teacher
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateHomeroomTeacherSchema),
  homeroomTeacherController.updateHomeroomTeacher
);

// Deactivate homeroom teacher
router.patch(
  "/:id/deactivate",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  homeroomTeacherController.deactivateHomeroomTeacher
);

// Delete homeroom teacher
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  homeroomTeacherController.deleteHomeroomTeacher
);

export default router;