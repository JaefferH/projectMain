// src/modules/finance/report/financial-report.routes.ts
import { Router } from "express";
import { financialReportController } from "./financial-report.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";
import { generateFinancialReportSchema } from "./financial-report.validation";

const router = Router();
router.use(authenticate);

// Quick overview (no report generation)
router.get("/overview", authorize("finance:read"), financialReportController.getFinancialOverview);

// Reports
router.get("/", authorize("finance:read"), financialReportController.getReports);
router.get("/:id", authorize("finance:read"), financialReportController.getReportById);

// Generate report
router.post("/generate", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(generateFinancialReportSchema), financialReportController.generateReport);

export default router;