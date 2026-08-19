// src/modules/assessment/report-card/report-card.validation.ts
import { z } from "zod";

export const finalizeReportCardSchema = z.object({
  homeroomRemarks: z.string().max(500).optional(),
  principalRemarks: z.string().max(500).optional(),
});

export type FinalizeReportCardDto = z.infer<typeof finalizeReportCardSchema>;