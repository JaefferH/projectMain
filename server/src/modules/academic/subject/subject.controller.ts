// src/modules/academic/subject/subject.controller.ts
import { Request, Response } from "express";
import { subjectService } from "./subject.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class SubjectController {
  getSubjects = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await subjectService.getSubjects({
      page, limit, organizationId, branchId, isActive, search,
    });

    res.status(200).json(ApiResponse.success("Subjects retrieved successfully.", result));
  });

  getSubjectById = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await subjectService.getSubjectById(id);
    res.status(200).json(ApiResponse.success("Subject retrieved successfully.", result));
  });

  createSubject = asyncHandler(async (req: Request, res: Response) => {
    const result = await subjectService.createSubject(req.body);
    res.status(201).json(ApiResponse.success("Subject created successfully.", result));
  });

  updateSubject = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await subjectService.updateSubject(id, req.body);
    res.status(200).json(ApiResponse.success("Subject updated successfully.", result));
  });

  deleteSubject = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await subjectService.deleteSubject(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  toggleSubjectStatus = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await subjectService.toggleSubjectStatus(id);
    res.status(200).json(ApiResponse.success("Subject status toggled successfully.", result));
  });
}

export const subjectController = new SubjectController();