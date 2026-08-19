// src/modules/schedule/period/period.validation.ts
import { z } from "zod";

export const createPeriodSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  name: z
    .string()
    .min(2, "Period name must be at least 2 characters")
    .max(50, "Period name must be less than 50 characters"),
  shortName: z.string().max(10).optional(),
  order: z.number().int().positive("Order must be a positive integer"),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format (24-hour)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format (24-hour)"),
  isBreak: z.boolean().optional().default(false),
});

export const updatePeriodSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  shortName: z.string().max(10).optional().nullable(),
  order: z.number().int().positive().optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  isBreak: z.boolean().optional(),
});

export const bulkCreatePeriodsSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  periods: z.array(z.object({
    name: z.string().min(2).max(50),
    shortName: z.string().max(10).optional(),
    order: z.number().int().positive(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    isBreak: z.boolean().optional().default(false),
  })).min(1, "At least one period is required"),
});

export type CreatePeriodDto = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodDto = z.infer<typeof updatePeriodSchema>;
export type BulkCreatePeriodsDto = z.infer<typeof bulkCreatePeriodsSchema>;