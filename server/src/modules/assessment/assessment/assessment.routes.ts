// src/modules/assessment/assessment/assessment.routes.ts
import { Router } from "express";
import { assessmentController } from "./assessment.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { 
  createAssessmentSchema, 
  createAssessmentResultsSchema, 
  updateAssessmentResultSchema 
} from "./assessment.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";

const router = Router();
router.use(authenticate);

// STUDENT personal views
router.get("/my-assessments", assessmentController.getMyAssessments);
router.get("/my-results/:assessmentId", assessmentController.getMyAssessmentResult);
router.get("/my-subject-results/:subjectId", assessmentController.getMySubjectResults);

// TEACHER personal views
router.get("/my-teacher-assessments", assessmentController.getMyTeacherAssessments);
router.get("/my-class-assessments", assessmentController.getHomeroomClassAssessments);
router.get(
  "/subject/:subjectId/classroom/:classroomId/results",
  assessmentController.getSubjectResultsForTeacher
);

// TEACHER views results
router.get("/:assessmentId/results", assessmentController.getAssessmentResultsForTeacher);
router.get("/student/:enrollmentId/all-results", assessmentController.getStudentAllResultsForHomeroom);

// Admin/Teacher views
router.get("/", authorize("academic:read"), assessmentController.getAssessments);
router.get("/:id", authorize("academic:read"), assessmentController.getAssessmentById);

// Create & manage (teachers for their own, admin for all)
router.post("/", validate(createAssessmentSchema), assessmentController.createAssessment);
router.post("/:id/results", validate(createAssessmentResultsSchema), assessmentController.addAssessmentResults);
router.patch("/results/:resultId", validate(updateAssessmentResultSchema), assessmentController.updateAssessmentResult);
router.patch("/:id/publish", assessmentController.publishAssessment);

// Admin only
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("academic:manage"), assessmentController.deleteAssessment);

export default router;