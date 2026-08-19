// src/modules/academic/academic-term/academic-term.routes.ts
import { Router } from "express";
import { academicTermController } from "./academic-term.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createAcademicTermSchema, updateAcademicTermSchema } from "./academic-term.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", authorize("academic:read"), academicTermController.getAcademicTerms);
router.get("/:id", authorize("academic:read"), academicTermController.getAcademicTermById);

router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createAcademicTermSchema),
  academicTermController.createAcademicTerm
);

router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateAcademicTermSchema),
  academicTermController.updateAcademicTerm
);

router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  academicTermController.deleteAcademicTerm
);

export default router;