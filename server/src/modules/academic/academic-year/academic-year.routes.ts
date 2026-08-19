// src/modules/academic/academic-year/academic-year.routes.ts
import { Router } from "express";
import { academicYearController } from "./academic-year.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createAcademicYearSchema, updateAcademicYearSchema } from "./academic-year.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", authorize("academic:read"), academicYearController.getAcademicYears);
router.get("/:id", authorize("academic:read"), academicYearController.getAcademicYearById);

router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createAcademicYearSchema),
  academicYearController.createAcademicYear
);

router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updateAcademicYearSchema),
  academicYearController.updateAcademicYear
);

router.patch(
  "/:id/set-current",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  academicYearController.setCurrentAcademicYear
);

router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  academicYearController.deleteAcademicYear
);

export default router;