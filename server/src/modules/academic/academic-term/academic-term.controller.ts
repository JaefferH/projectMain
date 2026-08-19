// src/modules/academic/academic-term/academic-term.controller.ts
import { Request, Response } from "express";
import { academicTermService } from "./academic-term.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class AcademicTermController {
  getAcademicTerms = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const isCurrent = req.query.isCurrent !== undefined ? req.query.isCurrent === "true" : undefined;
    const type = typeof req.query.type === "string" ? req.query.type : undefined;

    const result = await academicTermService.getAcademicTerms({
      page, limit, academicYearId, isCurrent, type,
    });

    res.status(200).json(ApiResponse.success("Academic terms retrieved successfully.", result));
  });

  getAcademicTermById = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicTermService.getAcademicTermById(id);
    res.status(200).json(ApiResponse.success("Academic term retrieved successfully.", result));
  });

  createAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    const result = await academicTermService.createAcademicTerm(req.body);
    res.status(201).json(ApiResponse.success("Academic term created successfully.", result));
  });

  updateAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicTermService.updateAcademicTerm(id, req.body);
    res.status(200).json(ApiResponse.success("Academic term updated successfully.", result));
  });

  deleteAcademicTerm = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicTermService.deleteAcademicTerm(id);
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const academicTermController = new AcademicTermController();