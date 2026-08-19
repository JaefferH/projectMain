// src/modules/finance/fee/invoice/invoice.routes.ts
import { Router } from "express";
import { invoiceController } from "./invoice.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { generateInvoicesSchema, updateInvoiceSchema, applyDiscountSchema } from "./invoice.validation";
import { SYSTEM_ROLES } from "../../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// Student views own invoices
router.get("/my-invoices", invoiceController.getMyInvoices);

// Admin views
router.get("/", authorize("finance:read"), invoiceController.getInvoices);
router.get("/:id", authorize("finance:read"), invoiceController.getInvoiceById);

// Generate invoices
router.post("/generate", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(generateInvoicesSchema), invoiceController.generateInvoices);

// Update
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(updateInvoiceSchema), invoiceController.updateInvoice);
router.patch("/:id/discount", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), validate(applyDiscountSchema), invoiceController.applyDiscount);
router.patch("/:id/cancel", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("finance:manage"), invoiceController.cancelInvoice);

export default router;