// src/modules/finance/fee/fee-structure/fee-structure.routes.ts
import { Router } from "express";
import { feeStructureController } from "./fee-structure.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createFeeStructureSchema, updateFeeStructureSchema, bulkCreateFeeStructureSchema } from "./fee-structure.validation";
import { SYSTEM_ROLES } from "../../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Fee schedule view (grouped by category)
router.get("/schedule/:academicYearId", authorize("finance:read"), feeStructureController.getFeeSchedule);

// Standard CRUD
router.get("/", authorize("finance:read"), feeStructureController.getFeeStructures);
router.get("/:id", authorize("finance:read"), feeStructureController.getFeeStructureById);

router.post("/", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(createFeeStructureSchema), feeStructureController.createFeeStructure);
router.post("/bulk", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(bulkCreateFeeStructureSchema), feeStructureController.bulkCreateFeeStructures);
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateFeeStructureSchema), feeStructureController.updateFeeStructure);
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), feeStructureController.deleteFeeStructure);

export default router;