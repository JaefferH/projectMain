// src/modules/assessment/assessment/assessment.controller.ts
import { Request, Response } from "express";
import { assessmentService } from "./assessment.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class AssessmentController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getAssessments = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.getAssessments({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      classroomId: req.query.classroomId as string,
      academicTermId: req.query.academicTermId as string,
      teacherAssignmentId: req.query.teacherAssignmentId as string,
      type: req.query.type as string,
      isPublished: req.query.isPublished !== undefined ? req.query.isPublished === "true" : undefined,
    });
    res.status(200).json(ApiResponse.success("Assessments retrieved successfully.", result));
  });

  getAssessmentById = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.getAssessmentById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Assessment retrieved successfully.", result));
  });

  createAssessment = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.createAssessment(req.body, req.user?.id);
    res.status(201).json(ApiResponse.success("Assessment created successfully.", result));
  });

  addAssessmentResults = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.addAssessmentResults(this.getId(req.params.id), req.body, req.user?.id);
    res.status(201).json(ApiResponse.success("Assessment results added successfully.", result));
  });

  updateAssessmentResult = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.updateAssessmentResult(this.getId(req.params.resultId), req.body, req.user?.id);
    res.status(200).json(ApiResponse.success("Assessment result updated successfully.", result));
  });

  publishAssessment = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.publishAssessment(this.getId(req.params.id), req.user?.id);
    res.status(200).json(ApiResponse.success("Assessment published successfully.", result));
  });

  deleteAssessment = asyncHandler(async (req: Request, res: Response) => {
    const result = await assessmentService.deleteAssessment(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });

  getMyAssessments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await assessmentService.getMyAssessments(req.user.id, req.query.academicTermId as string);
    res.status(200).json(ApiResponse.success("Your assessments retrieved successfully.", result));
  });

  getMyTeacherAssessments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await assessmentService.getMyTeacherAssessments(req.user.id, req.query.academicTermId as string);
    res.status(200).json(ApiResponse.success("Your assessments retrieved successfully.", result));
  });

  getHomeroomClassAssessments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await assessmentService.getHomeroomClassAssessments(req.user.id, req.query.academicTermId as string);
    res.status(200).json(ApiResponse.success("Class assessments retrieved successfully.", result));
  });

getMyAssessmentResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const result = await assessmentService.getMyAssessmentResult(
    req.user.id,
    this.getId(req.params.assessmentId)
  );
  res.status(200).json(ApiResponse.success("Assessment result retrieved successfully.", result));
});

getMySubjectResults = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const result = await assessmentService.getMySubjectResults(
    req.user.id,
    this.getId(req.params.subjectId),
    req.query.academicTermId as string
  );
  res.status(200).json(ApiResponse.success("Subject results retrieved successfully.", result));
});

getAssessmentResultsForTeacher = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const result = await assessmentService.getAssessmentResultsForTeacher(
    req.user.id,
    this.getId(req.params.assessmentId)
  );
  res.status(200).json(ApiResponse.success("Assessment results retrieved successfully.", result));
});

getStudentAllResultsForHomeroom = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const result = await assessmentService.getStudentAllResultsForHomeroom(
    req.user.id,
    this.getId(req.params.enrollmentId)
  );
  res.status(200).json(ApiResponse.success("Student results retrieved successfully.", result));
});

getSubjectResultsForTeacher = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  
  const { subjectId, classroomId } = req.params;
  const academicTermId = req.query.academicTermId as string;
  
  if (!academicTermId) throw new AppError("academicTermId is required", 400);
  
  const result = await assessmentService.getSubjectResultsForTeacher(
    req.user.id,
    this.getId(subjectId),
    this.getId(classroomId),
    academicTermId
  );
  res.status(200).json(ApiResponse.success("Subject results retrieved successfully.", result));
});
}

export const assessmentController = new AssessmentController();