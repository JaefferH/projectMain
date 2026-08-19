// src/modules/finance/fee/fee-category/fee-category.routes.ts
import { Router } from "express";
import { feeCategoryController } from "./fee-category.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createFeeCategorySchema, updateFeeCategorySchema } from "./fee-category.validation";
import { SYSTEM_ROLES } from "../../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

router.get("/", authorize("finance:read"), feeCategoryController.getFeeCategories);
router.get("/:id", authorize("finance:read"), feeCategoryController.getFeeCategoryById);

router.post("/", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(createFeeCategorySchema), feeCategoryController.createFeeCategory);
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateFeeCategorySchema), feeCategoryController.updateFeeCategory);
router.patch("/:id/toggle-status", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), feeCategoryController.toggleStatus);
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), feeCategoryController.deleteFeeCategory);

export default router;