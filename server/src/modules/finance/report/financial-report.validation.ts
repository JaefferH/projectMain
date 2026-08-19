import { z } from "zod";

export const generateFinancialReportSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  academicYearId: z.string().cuid("Invalid academic year ID").optional(),
  reportType: z.enum(["MONTHLY", "TERMLY", "YEARLY", "CUSTOM"]),
  reportPeriod: z.string().min(2, "Report period is required"),
  periodStart: z.string().datetime("Invalid period start"),
  periodEnd: z.string().datetime("Invalid period end"),
  notes: z.string().max(500).optional(),
});

export type GenerateFinancialReportDto = z.infer<typeof generateFinancialReportSchema>;