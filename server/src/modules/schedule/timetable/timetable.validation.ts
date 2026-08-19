// src/modules/schedule/timetable/timetable.validation.ts
import { z } from "zod";

export const createTimetableEntrySchema = z.object({
  teacherAssignmentId: z.string().cuid("Invalid teacher assignment ID"),
  schedulePeriodId: z.string().cuid("Invalid schedule period ID"),
  classroomId: z.string().cuid("Invalid classroom ID"),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  room: z.string().max(50).optional(),
});

export const updateTimetableEntrySchema = z.object({
  teacherAssignmentId: z.string().cuid().optional(),
  schedulePeriodId: z.string().cuid().optional(),
  classroomId: z.string().cuid().optional(),
  dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]).optional(),
  room: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const bulkCreateTimetableSchema = z.object({
  entries: z.array(createTimetableEntrySchema).min(1, "At least one entry is required"),
});

export type CreateTimetableEntryDto = z.infer<typeof createTimetableEntrySchema>;
export type UpdateTimetableEntryDto = z.infer<typeof updateTimetableEntrySchema>;
export type BulkCreateTimetableDto = z.infer<typeof bulkCreateTimetableSchema>;