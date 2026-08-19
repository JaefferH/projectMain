// src/modules/academic/classroom/classroom.routes.ts
import { Router } from "express";
import { classroomController } from "./classroom.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createClassroomSchema, updateClassroomSchema } from "./classroom.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

router.use((req, res, next) => {
  console.log('Classroom Route:', {
    method: req.method,
    path: req.path,
    params: req.params,
    query: req.query,
  });
  next();
});

// IMPORTANT: Specific routes must come BEFORE parameterized routes

// Get classrooms by academic year (specific route first)
router.get(
  "/academic-year/:academicYearId",
  authorize("academic:read"),
  classroomController.getClassroomsByAcademicYear
);

// Get all classrooms (with optional query filters)
router.get(
  "/",
  authorize("academic:read"),
  classroomController.getClassrooms
);

// Get classroom by ID (parameterized route last)
router.get(
  "/:id",
  authorize("academic:read"),
  classroomController.getClassroomById
);

router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createClassroomSchema),
  classroomController.createClassroom
);

router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateClassroomSchema),
  classroomController.updateClassroom
);

router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  classroomController.deleteClassroom
);

export default router;