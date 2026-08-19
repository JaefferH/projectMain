// src/modules/finance/payment/payment.routes.ts
import { Router } from "express";
import { paymentController } from "./payment.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createPaymentSchema } from "./payment.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Student views own payments
router.get("/my-payments", paymentController.getMyPayments);

// Get payments for a specific invoice
router.get("/invoice/:invoiceId", authorize("finance:read"), paymentController.getPaymentsByInvoice);

// Admin views
router.get("/", authorize("finance:read"), paymentController.getPayments);
router.get("/:id", authorize("finance:read"), paymentController.getPaymentById);

// Record payment
router.post("/", authorize("finance:manage"), validate(createPaymentSchema), paymentController.createPayment);

export default router;