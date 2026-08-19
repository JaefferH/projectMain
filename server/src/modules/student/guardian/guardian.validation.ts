// src/modules/student/guardian/guardian.validation.ts
import { z } from "zod";

export const createGuardianSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  relationship: z
    .string()
    .min(2, "Relationship is required")
    .max(50, "Relationship must be less than 50 characters"),
  phone: z.string().optional().nullable(),
  alternativePhone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  nationalId: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  // Optionally link to students during creation
  studentIds: z.array(z.string().cuid("Invalid student ID")).optional(),
});

export const updateGuardianSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  relationship: z.string().min(2).max(50).optional(),
  phone: z.string().optional().nullable(),
  alternativePhone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  nationalId: z.string().optional().nullable(),
  telegramChatId: z.string().optional().nullable(),
  branchId: z.string().cuid().optional(),
});

export const linkGuardianToStudentSchema = z.object({
  guardianId: z.string().cuid("Invalid guardian ID"),
  studentId: z.string().cuid("Invalid student ID"),
  isPrimary: z.boolean().optional().default(false),
});

export type CreateGuardianDto = z.infer<typeof createGuardianSchema>;
export type UpdateGuardianDto = z.infer<typeof updateGuardianSchema>;
export type LinkGuardianToStudentDto = z.infer<typeof linkGuardianToStudentSchema>;