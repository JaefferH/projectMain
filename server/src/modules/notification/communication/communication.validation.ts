// src/modules/communication/communication.validation.ts
import { z } from "zod";

export const sendGuardianMessageSchema = z.object({
  studentId: z.string().cuid("Invalid student ID"),
  guardianId: z.string().cuid("Invalid guardian ID"),
  message: z.string().min(2, "Message is required").max(1000, "Message too long"),
});

export const sendBulkGuardianMessageSchema = z.object({
  classroomId: z.string().cuid("Invalid classroom ID"),
  message: z.string().min(2, "Message is required").max(1000, "Message too long"),
  // Optional: filter by specific guardians
  guardianIds: z.array(z.string().cuid()).optional(),
});