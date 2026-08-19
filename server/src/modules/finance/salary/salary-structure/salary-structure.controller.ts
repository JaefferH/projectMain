// src/modules/finance/salary/salary-structure/salary-structure.controller.ts
import { Request, Response } from "express";
import { salaryStructureService } from "./salary-structure.service";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../../shared/responses/ApiResponse";
import { AppError } from "../../../../shared/errors/AppError";

class SalaryStructureController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getSalaryStructures = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryStructureService.getSalaryStructures({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      branchId: req.query.branchId as string,
      profileId: req.query.profileId as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
    });
    res.status(200).json(ApiResponse.success("Salary structures retrieved successfully.", result));
  });

  getSalaryStructureById = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryStructureService.getSalaryStructureById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Salary structure retrieved successfully.", result));
  });

  getMySalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await salaryStructureService.getMySalaryStructure(req.user.id);
    res.status(200).json(ApiResponse.success("Your salary structure retrieved successfully.", result));
  });

  createSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryStructureService.createSalaryStructure(req.body);
    res.status(201).json(ApiResponse.success("Salary structure created successfully.", result));
  });

  updateSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryStructureService.updateSalaryStructure(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Salary structure updated successfully.", result));
  });

  deleteSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryStructureService.deleteSalaryStructure(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const salaryStructureController = new SalaryStructureController();