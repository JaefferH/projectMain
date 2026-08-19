// src/modules/finance/revenue/revenue.routes.ts
import { Router } from "express";
import { revenueController } from "./revenue.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createRevenueCategorySchema, updateRevenueCategorySchema, createRevenueSchema, updateRevenueSchema } from "./revenue.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Summary
router.get("/summary", authorize("finance:read"), revenueController.getRevenueSummary);

// Categories
router.get("/categories", authorize("finance:read"), revenueController.getRevenueCategories);
router.post("/categories", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(createRevenueCategorySchema), revenueController.createRevenueCategory);
router.patch("/categories/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateRevenueCategorySchema), revenueController.updateRevenueCategory);
router.delete("/categories/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), revenueController.deleteRevenueCategory);

// Revenues
router.get("/", authorize("finance:read"), revenueController.getRevenues);
router.get("/:id", authorize("finance:read"), revenueController.getRevenueById);
router.post("/", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(createRevenueSchema), revenueController.createRevenue);
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateRevenueSchema), revenueController.updateRevenue);
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), revenueController.deleteRevenue);

export default router;