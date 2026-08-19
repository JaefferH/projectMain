// src/modules/finance/fee/fee-category/fee-category.controller.ts
import { Request, Response } from "express";
import { feeCategoryService } from "./fee-category.service";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../../shared/responses/ApiResponse";

class FeeCategoryController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getFeeCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeCategoryService.getFeeCategories({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      branchId: req.query.branchId as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
      search: req.query.search as string,
    });
    res.status(200).json(ApiResponse.success("Fee categories retrieved successfully.", result));
  });

  getFeeCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeCategoryService.getFeeCategoryById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Fee category retrieved successfully.", result));
  });

  createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeCategoryService.createFeeCategory(req.body);
    res.status(201).json(ApiResponse.success("Fee category created successfully.", result));
  });

  updateFeeCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeCategoryService.updateFeeCategory(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Fee category updated successfully.", result));
  });

  deleteFeeCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeCategoryService.deleteFeeCategory(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });

  toggleStatus = asyncHandler(async (req: Request, res: Response) => {
    const result = await feeCategoryService.toggleStatus(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Fee category status toggled successfully.", result));
  });
}

export const feeCategoryController = new FeeCategoryController();