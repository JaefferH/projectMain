// src/modules/assessment/report-card/report-card.controller.ts
import { Request, Response } from "express";
import { reportCardService } from "./report-card.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class ReportCardController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getMyReportCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const academicYearId = req.query.academicYearId as string;
    if (!academicYearId) throw new AppError("academicYearId is required", 400);
    const result = await reportCardService.getMyReportCard(req.user.id, academicYearId);
    res.status(200).json(ApiResponse.success("Your report card retrieved successfully.", result));
  });

  getClassReportCards = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const academicYearId = req.query.academicYearId as string;
    if (!academicYearId) throw new AppError("academicYearId is required", 400);
    const result = await reportCardService.getClassReportCards(req.user.id, academicYearId);
    res.status(200).json(ApiResponse.success("Class report cards retrieved successfully.", result));
  });

  getReportCardByEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const academicYearId = req.query.academicYearId as string;
    if (!academicYearId) throw new AppError("academicYearId is required", 400);
    const result = await reportCardService.getOrGenerateReportCard(
      this.getId(req.params.enrollmentId),
      academicYearId
    );
    res.status(200).json(ApiResponse.success("Report card retrieved successfully.", result));
  });

  getStudentReportCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    
    const enrollmentId = this.getId(req.params.enrollmentId);
    const academicYearId = (req.query.academicYearId as string)?.trim();
    
    if (!academicYearId) throw new AppError("academicYearId is required", 400);
    
    const result = await reportCardService.getStudentReportCard(
      req.user.id,
      enrollmentId,
      academicYearId
    );
    
    res.status(200).json(ApiResponse.success("Student report card retrieved successfully.", result));
  });

  finalizeReportCard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await reportCardService.finalizeReportCard(
      this.getId(req.params.id),
      req.user.id,
      req.body
    );
    res.status(200).json(ApiResponse.success("Report card finalized successfully.", result));
  });

  regenerateReportCard = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  
  const enrollmentId = this.getId(req.params.enrollmentId);
  const academicYearId = (req.query.academicYearId as string)?.trim();
  
  if (!academicYearId) throw new AppError("academicYearId is required", 400);
  
  const result = await reportCardService.regenerateReportCard(
    req.user.id,
    enrollmentId,
    academicYearId
  );
  
  res.status(200).json(ApiResponse.success("Report card regenerated successfully.", result));
});
}

export const reportCardController = new ReportCardController();