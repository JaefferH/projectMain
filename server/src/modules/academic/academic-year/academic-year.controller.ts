// src/modules/academic/academic-year/academic-year.controller.ts
import { Request, Response } from "express";
import { academicYearService } from "./academic-year.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class AcademicYearController {
  getAcademicYears = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const isCurrent = req.query.isCurrent !== undefined ? req.query.isCurrent === "true" : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await academicYearService.getAcademicYears({
      page,
      limit,
      branchId,
      isCurrent,
      search,
    });

    res.status(200).json(ApiResponse.success("Academic years retrieved successfully.", result));
  });

  getAcademicYearById = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicYearService.getAcademicYearById(id);
    res.status(200).json(ApiResponse.success("Academic year retrieved successfully.", result));
  });

  createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const result = await academicYearService.createAcademicYear(req.body);
    res.status(201).json(ApiResponse.success("Academic year created successfully.", result));
  });

  updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicYearService.updateAcademicYear(id, req.body);
    res.status(200).json(ApiResponse.success("Academic year updated successfully.", result));
  });

  deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicYearService.deleteAcademicYear(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  setCurrentAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await academicYearService.setCurrentAcademicYear(id);
    res.status(200).json(ApiResponse.success("Academic year set as current successfully.", result));
  });
}

export const academicYearController = new AcademicYearController();