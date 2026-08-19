// src/modules/finance/fee/invoice/invoice.validation.ts
import { z } from "zod";

export const generateInvoicesSchema = z.object({
  academicYearId: z.string().cuid("Invalid academic year ID"),
  classroomId: z.string().cuid("Invalid classroom ID").optional(), // Optional: generate for specific class
  enrollmentIds: z.array(z.string().cuid()).optional(), // Optional: generate for specific students
  dueDate: z.string().datetime().optional(), // Override default due date
});

export const updateInvoiceSchema = z.object({
  discount: z.number().min(0).optional(),
  discountReason: z.string().max(200).optional(),
  status: z.enum(["PENDING", "PAID", "CANCELLED", "WAIVED"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional(),
});

export const applyDiscountSchema = z.object({
  discount: z.number().min(0),
  discountReason: z.string().min(2, "Reason is required").max(200),
});

export type GenerateInvoicesDto = z.infer<typeof generateInvoicesSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type ApplyDiscountDto = z.infer<typeof applyDiscountSchema>;