import { Request, Response } from "express";
import { financialReportService } from "./financial-report.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class FinancialReportController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getReports = asyncHandler(async (req: Request, res: Response) => {
    const result = await financialReportService.getReports({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      branchId: req.query.branchId as string,
      academicYearId: req.query.academicYearId as string,
      reportType: req.query.reportType as string,
      reportPeriod: req.query.reportPeriod as string,
    });
    res.status(200).json(ApiResponse.success("Financial reports retrieved successfully.", result));
  });

  getReportById = asyncHandler(async (req: Request, res: Response) => {
    const result = await financialReportService.getReportById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Financial report retrieved successfully.", result));
  });

  getFinancialOverview = asyncHandler(async (req: Request, res: Response) => {
    const { branchId, periodStart, periodEnd } = req.query;
    if (!branchId || !periodStart || !periodEnd) {
      throw new AppError("branchId, periodStart, and periodEnd are required", 400);
    }
    const result = await financialReportService.getFinancialOverview({
      branchId: branchId as string,
      periodStart: periodStart as string,
      periodEnd: periodEnd as string,
    });
    res.status(200).json(ApiResponse.success("Financial overview retrieved successfully.", result));
  });

  generateReport = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await financialReportService.generateReport(req.body, req.user.id);
    res.status(201).json(ApiResponse.success("Financial report generated successfully.", result));
  });
}

export const financialReportController = new FinancialReportController();