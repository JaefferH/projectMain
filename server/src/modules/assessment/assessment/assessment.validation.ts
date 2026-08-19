import { z } from "zod";

export const createAssessmentSchema = z.object({
  teacherAssignmentId: z.string().cuid("Invalid teacher assignment ID"),
  classroomId: z.string().cuid("Invalid classroom ID"),
  academicTermId: z.string().cuid("Invalid academic term ID"),
  title: z.string().min(2, "Title must be at least 2 characters").max(200),
  type: z.enum(["QUIZ", "TEST", "MID_EXAM", "FINAL_EXAM", "ASSIGNMENT", "PROJECT", "HOMEWORK", "PARTICIPATION", "OTHER"]),
  totalMarks: z.number().positive("Total marks must be positive"),
  weight: z.number().min(0).max(100, "Weight must be between 0 and 100"),
  assessmentDate: z.string().datetime("Invalid date"),
});

export const updateAssessmentSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  type: z.enum(["QUIZ", "TEST", "MID_EXAM", "FINAL_EXAM", "ASSIGNMENT", "PROJECT", "HOMEWORK", "PARTICIPATION", "OTHER"]).optional(),
  totalMarks: z.number().positive().optional(),
  weight: z.number().min(0).max(100).optional(),
  assessmentDate: z.string().datetime().optional(),
  isPublished: z.boolean().optional(),
});

export const createAssessmentResultsSchema = z.object({
  results: z.array(z.object({
    enrollmentId: z.string().cuid("Invalid enrollment ID"),
    marksObtained: z.number().min(0, "Marks cannot be negative"),
    remarks: z.string().max(200).optional(),
  })).min(1, "At least one result is required"),
});

export const updateAssessmentResultSchema = z.object({
  marksObtained: z.number().min(0),
  remarks: z.string().max(200).optional(),
});

export type CreateAssessmentDto = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentDto = z.infer<typeof updateAssessmentSchema>;
export type CreateAssessmentResultsDto = z.infer<typeof createAssessmentResultsSchema>;
export type UpdateAssessmentResultDto = z.infer<typeof updateAssessmentResultSchema>;