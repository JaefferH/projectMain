// src/modules/announcement/announcement.validation.ts
import { z } from "zod";

export const createAnnouncementSchema = z.object({
  branchId: z.string().cuid("Invalid branch ID"),
  title: z.string().min(2, "Title is required").max(200),
  content: z.string().min(2, "Content is required").max(5000),
  excerpt: z.string().max(300).optional(),
  type: z.enum([
    "GENERAL", "ASSESSMENT", "EXAM", "FEE_DUE", "FEE_PAID",
    "ATTENDANCE", "GRADE_POSTED", "REPORT_CARD", "EVENT", "HOLIDAY",
    "MEETING", "EMERGENCY", "SYSTEM"
  ]).optional().default("GENERAL"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional().default("NORMAL"),
  
  // Publishing
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  eventDate: z.string().datetime().optional(),
  eventStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  eventEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  eventLocation: z.string().max(200).optional(),
  isAllDay: z.boolean().optional(),
  color: z.string().optional(),
  
  // Audience targeting
  targetAudience: z.array(z.enum(["ALL", "TEACHER", "STUDENT", "ADMIN"])).optional().default(["ALL"]),
  targetRoles: z.array(z.string()).optional(),
  targetUserIds: z.array(z.string().cuid()).optional(),
  targetClassroomIds: z.array(z.string().cuid()).optional(),
  
  // Push notification settings
  sendPushNotification: z.boolean().optional().default(false),
  pushChannels: z.array(z.enum(["IN_APP", "TELEGRAM", "SMS", "EMAIL"])).optional().default(["IN_APP"]),
  pushScheduledAt: z.string().datetime().optional(),
  
  metadata: z.any().optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(2).max(5000).optional(),
  excerpt: z.string().max(300).optional().nullable(),
  type: z.enum([
    "GENERAL", "ASSESSMENT", "EXAM", "FEE_DUE", "FEE_PAID",
    "ATTENDANCE", "GRADE_POSTED", "REPORT_CARD", "EVENT", "HOLIDAY",
    "MEETING", "EMERGENCY", "SYSTEM"
  ]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  isPublished: z.boolean().optional(),
  targetAudience: z.array(z.enum(["ALL", "TEACHER", "STUDENT", "ADMIN"])).optional(),
});

export type CreateAnnouncementDto = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementDto = z.infer<typeof updateAnnouncementSchema>;