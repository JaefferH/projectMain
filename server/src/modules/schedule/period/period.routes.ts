// src/modules/schedule/period/period.routes.ts
import { Router } from "express";
import { schedulePeriodController } from "./period.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createPeriodSchema, updatePeriodSchema, bulkCreatePeriodsSchema } from "./period.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", authorize("academic:read"), schedulePeriodController.getPeriods);
router.get("/:id", authorize("academic:read"), schedulePeriodController.getPeriodById);

router.post(
  "/",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(createPeriodSchema),
  schedulePeriodController.createPeriod
);

router.post(
  "/bulk",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(bulkCreatePeriodsSchema),
  schedulePeriodController.bulkCreatePeriods
);

router.patch(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  validate(updatePeriodSchema),
  schedulePeriodController.updatePeriod
);

router.delete(
  "/:id",
  requireMinRole(SYSTEM_ROLES.ADMIN),
  authorize("academic:manage"),
  schedulePeriodController.deletePeriod
);

export default router;