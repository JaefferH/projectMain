// src/modules/finance/salary/salary-payment/salary-payment.routes.ts
import { Router } from "express";
import { salaryPaymentController } from "./salary-payment.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { generateSalaryPaymentSchema, processSalaryPaymentSchema, bulkGenerateSalarySchema } from "./salary-payment.validation";
import { SYSTEM_ROLES } from "../../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Staff views own salary payments
router.get("/my-payments", salaryPaymentController.getMySalaryPayments);

// Admin views
router.get("/", authorize("finance:read"), salaryPaymentController.getSalaryPayments);
router.get("/:id", authorize("finance:read"), salaryPaymentController.getSalaryPaymentById);

// Generate
router.post("/generate", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(generateSalaryPaymentSchema), salaryPaymentController.generateSalaryPayment);
router.post("/bulk-generate", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(bulkGenerateSalarySchema), salaryPaymentController.bulkGenerateSalaryPayments);

// Process
router.patch("/:id/process", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(processSalaryPaymentSchema), salaryPaymentController.processSalaryPayment);
router.patch("/:id/cancel", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), salaryPaymentController.cancelSalaryPayment);

export default router;