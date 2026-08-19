// src/modules/finance/salary/salary-payment/salary-payment.validation.ts
import { z } from "zod";

export const generateSalaryPaymentSchema = z.object({
  salaryStructureId: z.string().cuid("Invalid salary structure ID"),
  paymentPeriod: z.string().min(4, "Payment period is required"), // e.g., "2025-09"
  periodStart: z.string().datetime("Invalid period start"),
  periodEnd: z.string().datetime("Invalid period end"),
  notes: z.string().max(500).optional(),
});

export const processSalaryPaymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE", "CREDIT_CARD", "DEBIT_CARD", "ONLINE", "OTHER"]),
  referenceNumber: z.string().optional(),
  paymentDate: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export const bulkGenerateSalarySchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  paymentPeriod: z.string().min(4),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  notes: z.string().max(500).optional(),
});

export type GenerateSalaryPaymentDto = z.infer<typeof generateSalaryPaymentSchema>;
export type ProcessSalaryPaymentDto = z.infer<typeof processSalaryPaymentSchema>;
export type BulkGenerateSalaryDto = z.infer<typeof bulkGenerateSalarySchema>;