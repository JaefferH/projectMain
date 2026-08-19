// src/modules/finance/revenue/revenue.controller.ts
import { Request, Response } from "express";
import { revenueService } from "./revenue.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class RevenueController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  // Categories
  getRevenueCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.getRevenueCategories({
      branchId: req.query.branchId as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
    });
    res.status(200).json(ApiResponse.success("Revenue categories retrieved successfully.", result));
  });

  createRevenueCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.createRevenueCategory(req.body);
    res.status(201).json(ApiResponse.success("Revenue category created successfully.", result));
  });

  updateRevenueCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.updateRevenueCategory(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Revenue category updated successfully.", result));
  });

  deleteRevenueCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.deleteRevenueCategory(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });

  // Revenues
  getRevenueSummary = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.getRevenueSummary({
      branchId: req.query.branchId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.status(200).json(ApiResponse.success("Revenue summary retrieved successfully.", result));
  });

  getRevenues = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.getRevenues({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      branchId: req.query.branchId as string,
      categoryId: req.query.categoryId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    });
    res.status(200).json(ApiResponse.success("Revenues retrieved successfully.", result));
  });

  getRevenueById = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.getRevenueById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Revenue retrieved successfully.", result));
  });

  createRevenue = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.createRevenue(req.body, req.user?.id);
    res.status(201).json(ApiResponse.success("Revenue recorded successfully.", result));
  });

  updateRevenue = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.updateRevenue(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Revenue updated successfully.", result));
  });

  deleteRevenue = asyncHandler(async (req: Request, res: Response) => {
    const result = await revenueService.deleteRevenue(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const revenueController = new RevenueController();