// src/modules/academic/teacher-assignment/teacher-assignment.routes.ts
import { Router } from "express";
import { teacherAssignmentController } from "./teacher-assignment.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createTeacherAssignmentSchema, 
  updateTeacherAssignmentSchema,
  bulkCreateTeacherAssignmentSchema 
} from "./teacher-assignment.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

// Get current teacher's own assignments (no permission required - just authentication)s
router.get(
  "/my-assignments",
  teacherAssignmentController.getMyAssignments
);

// Get current teacher's assignments grouped by term
router.get(
  "/my-assignments/by-term",
  teacherAssignmentController.getMyAssignmentsByTerm
);

// Get assignments by teacher (specific routes first)
router.get(
  "/teacher/:teacherId",
  authorize("academic:read"),
  teacherAssignmentController.getTeacherAssignmentsByTeacher
);

// Get assignments by classroom
router.get(
  "/classroom/:classroomId",
  authorize("academic:read"),
  teacherAssignmentController.getTeacherAssignmentsByClassroom
);

// Get all assignments
router.get(
  "/",
  authorize("academic:read"),
  teacherAssignmentController.getTeacherAssignments
);

// Get assignment by ID
router.get(
  "/:id",
  authorize("academic:read"),
  teacherAssignmentController.getTeacherAssignmentById
);

// Create assignment
router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createTeacherAssignmentSchema),
  teacherAssignmentController.createTeacherAssignment
);

// Bulk create assignments
router.post(
  "/bulk",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(bulkCreateTeacherAssignmentSchema),
  teacherAssignmentController.bulkCreateTeacherAssignments
);

// Update assignment
router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateTeacherAssignmentSchema),
  teacherAssignmentController.updateTeacherAssignment
);

// Delete assignment
router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  teacherAssignmentController.deleteTeacherAssignment
);

export default router;