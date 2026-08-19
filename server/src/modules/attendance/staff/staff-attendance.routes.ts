// src/modules/attendance/staff/staff-attendance.routes.ts
import { Router } from "express";
import { staffAttendanceController } from "./staff-attendance.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createStaffAttendanceSchema, updateStaffAttendanceSchema } from "./staff-attendance.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

// Staff views own attendance & check-in/out
router.get("/my-attendance", staffAttendanceController.getMyAttendance);
router.post("/check-in", validate(createStaffAttendanceSchema), staffAttendanceController.checkIn);
router.post("/check-out", staffAttendanceController.checkOut);

// Admin views all staff attendance
router.get("/", authorize("academic:read"), staffAttendanceController.getStaffAttendance);
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("academic:manage"), validate(updateStaffAttendanceSchema), staffAttendanceController.updateStaffAttendance);

export default router;