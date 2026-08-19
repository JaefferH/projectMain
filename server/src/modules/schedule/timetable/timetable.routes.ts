// src/modules/schedule/timetable/timetable.routes.ts
import { Router } from "express";
import { timetableController } from "./timetable.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createTimetableEntrySchema, 
  updateTimetableEntrySchema, 
  bulkCreateTimetableSchema 
} from "./timetable.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

// Student's own timetable
router.get("/my-timetable", timetableController.getMyTimetable);

// Teacher's own timetable
router.get("/my-teacher-timetable", timetableController.getMyTeacherTimetable);

// Get all entries
router.get("/", authorize("academic:read"), timetableController.getTimetableEntries);
router.get("/:id", authorize("academic:read"), timetableController.getTimetableEntryById);

router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createTimetableEntrySchema),
  timetableController.createTimetableEntry
);

router.post(
  "/bulk",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(bulkCreateTimetableSchema),
  timetableController.bulkCreateTimetable
);

router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateTimetableEntrySchema),
  timetableController.updateTimetableEntry
);

router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  timetableController.deleteTimetableEntry
);

export default router;