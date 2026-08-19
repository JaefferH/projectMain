// src/modules/schedule/period/period.controller.ts
import { Request, Response } from "express";
import { schedulePeriodService } from "./period.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class SchedulePeriodController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getPeriods = asyncHandler(async (req: Request, res: Response) => {
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const isBreak = req.query.isBreak !== undefined ? req.query.isBreak === "true" : undefined;

    const result = await schedulePeriodService.getPeriods({ branchId, isBreak });

    res.status(200).json(ApiResponse.success("Schedule periods retrieved successfully.", result));
  });

  getPeriodById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await schedulePeriodService.getPeriodById(id);
    res.status(200).json(ApiResponse.success("Schedule period retrieved successfully.", result));
  });

  createPeriod = asyncHandler(async (req: Request, res: Response) => {
    const result = await schedulePeriodService.createPeriod(req.body);
    res.status(201).json(ApiResponse.success("Schedule period created successfully.", result));
  });

  bulkCreatePeriods = asyncHandler(async (req: Request, res: Response) => {
    const result = await schedulePeriodService.bulkCreatePeriods(req.body);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  updatePeriod = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await schedulePeriodService.updatePeriod(id, req.body);
    res.status(200).json(ApiResponse.success("Schedule period updated successfully.", result));
  });

  deletePeriod = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await schedulePeriodService.deletePeriod(id);
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const schedulePeriodController = new SchedulePeriodController();