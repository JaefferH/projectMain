// src/modules/finance/salary/salary-payment/salary-payment.controller.ts
import { Request, Response } from "express";
import { salaryPaymentService } from "./salary-payment.service";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../../shared/responses/ApiResponse";
import { AppError } from "../../../../shared/errors/AppError";

class SalaryPaymentController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getSalaryPayments = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryPaymentService.getSalaryPayments({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      branchId: req.query.branchId as string,
      profileId: req.query.profileId as string,
      paymentPeriod: req.query.paymentPeriod as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.status(200).json(ApiResponse.success("Salary payments retrieved successfully.", result));
  });

  getSalaryPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryPaymentService.getSalaryPaymentById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Salary payment retrieved successfully.", result));
  });

  getMySalaryPayments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await salaryPaymentService.getMySalaryPayments(req.user.id, {
      paymentPeriod: req.query.paymentPeriod as string,
    });
    res.status(200).json(ApiResponse.success("Your salary payments retrieved successfully.", result));
  });

  generateSalaryPayment = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryPaymentService.generateSalaryPayment(req.body, req.user?.id);
    res.status(201).json(ApiResponse.success("Salary payment generated successfully.", result));
  });

  bulkGenerateSalaryPayments = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryPaymentService.bulkGenerateSalaryPayments(req.body, req.user?.id);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  processSalaryPayment = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryPaymentService.processSalaryPayment(this.getId(req.params.id), req.body, req.user?.id);
    res.status(200).json(ApiResponse.success("Salary payment processed successfully.", result));
  });

  cancelSalaryPayment = asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryPaymentService.cancelSalaryPayment(this.getId(req.params.id), req.body?.reason);
    res.status(200).json(ApiResponse.success("Salary payment cancelled successfully.", result));
  });
}

export const salaryPaymentController = new SalaryPaymentController();