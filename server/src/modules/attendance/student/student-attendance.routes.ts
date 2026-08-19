// src/modules/attendance/student/student-attendance.routes.ts
import { Router } from "express";
import { studentAttendanceController } from "./student-attendance.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createStudentAttendanceSessionSchema, 
  updateStudentAttendanceRecordSchema 
} from "./student-attendance.validation";
import { SYSTEM_ROLES } from "@shared/constants/roles";

const router = Router();

router.use(authenticate);

// Student views own attendance
router.get("/my-attendance", studentAttendanceController.getMyAttendance);

// View own attendance sessions
router.get("/my-sessions", studentAttendanceController.getMyAttendanceSessions);

// View specific session (own only)
router.get("/my-sessions/:id", studentAttendanceController.getMyAttendanceSessionById);

// Update record in own session
router.patch(
  "/my-sessions/:sessionId/records/:recordId",
  validate(updateStudentAttendanceRecordSchema),
  studentAttendanceController.updateMyAttendanceRecord
);

// Lock own session
router.patch(
  "/my-sessions/:id/lock",
  studentAttendanceController.lockMyAttendanceSession
);

// Get all sessions
router.get("/", authorize("academic:read"), studentAttendanceController.getAttendanceSessions);
router.get("/:id", authorize("academic:read"), studentAttendanceController.getAttendanceSessionById);

// Create attendance session (homeroom teacher only)
router.post(
  "/",
  validate(createStudentAttendanceSessionSchema),
  studentAttendanceController.createAttendanceSession
);

// Update attendance record
router.patch(
  "/:sessionId/records/:recordId",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateStudentAttendanceRecordSchema),
  studentAttendanceController.updateAttendanceRecord
);

// Lock attendance session
router.patch(
  "/:id/lock",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  studentAttendanceController.lockAttendanceSession
);

export default router;