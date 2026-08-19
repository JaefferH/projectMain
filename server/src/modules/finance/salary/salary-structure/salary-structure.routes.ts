// src/modules/finance/salary/salary-structure/salary-structure.routes.ts
import { Router } from "express";
import { salaryStructureController } from "./salary-structure.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createSalaryStructureSchema, updateSalaryStructureSchema } from "./salary-structure.validation";
import { SYSTEM_ROLES } from "../../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Staff views own salary structure
router.get("/my-salary", salaryStructureController.getMySalaryStructure);

// Admin views
router.get("/", authorize("finance:read"), salaryStructureController.getSalaryStructures);
router.get("/:id", authorize("finance:read"), salaryStructureController.getSalaryStructureById);

// Admin manages
router.post("/", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(createSalaryStructureSchema), salaryStructureController.createSalaryStructure);
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateSalaryStructureSchema), salaryStructureController.updateSalaryStructure);
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), salaryStructureController.deleteSalaryStructure);

export default router;