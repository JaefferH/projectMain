// src/modules/academic/subject/subject.routes.ts
import { Router } from "express";
import { subjectController } from "./subject.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createSubjectSchema, updateSubjectSchema } from "./subject.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", authorize("academic:read"), subjectController.getSubjects);
router.get("/:id", authorize("academic:read"), subjectController.getSubjectById);

router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createSubjectSchema),
  subjectController.createSubject
);

router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateSubjectSchema),
  subjectController.updateSubject
);

router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  subjectController.deleteSubject
);

router.patch(
  "/:id/toggle-status",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  subjectController.toggleSubjectStatus
);

export default router;