// src/modules/finance/fee/fee-structure/fee-structure.controller.ts
import { Request, Response } from "express";
import { feeStructureService } from "./fee-structure.service";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../../shared/responses/ApiResponse";

class FeeStructureController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getFeeStructures = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.getFeeStructures({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      academicYearId: req.query.academicYearId as string,
      feeCategoryId: req.query.feeCategoryId as string,
      branchId: req.query.branchId as string,
      isOptional: req.query.isOptional !== undefined ? req.query.isOptional === "true" : undefined,
    });
    res.status(200).json(ApiResponse.success("Fee structures retrieved successfully.", result));
  });

  getFeeStructureById = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.getFeeStructureById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Fee structure retrieved successfully.", result));
  });

  getFeeSchedule = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.getFeeScheduleByAcademicYear(
      this.getId(req.params.academicYearId),
      req.query.branchId as string
    );
    res.status(200).json(ApiResponse.success("Fee schedule retrieved successfully.", result));
  });

  createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.createFeeStructure(req.body);
    res.status(201).json(ApiResponse.success("Fee structure created successfully.", result));
  });

  bulkCreateFeeStructures = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.bulkCreateFeeStructures(req.body);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  updateFeeStructure = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.updateFeeStructure(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Fee structure updated successfully.", result));
  });

  deleteFeeStructure = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeStructureService.deleteFeeStructure(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const feeStructureController = new FeeStructureController();