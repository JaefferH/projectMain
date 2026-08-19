// src/modules/finance/payment/payment.validation.ts
import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().cuid("Invalid invoice ID"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE", "CREDIT_CARD", "DEBIT_CARD", "ONLINE", "OTHER"]),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().datetime().optional(), // Defaults to now
  notes: z.string().max(500).optional(),
});

export const updatePaymentSchema = z.object({
  notes: z.string().max(500).optional(),
  referenceNumber: z.string().optional(),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;