// src/modules/finance/payment/payment.controller.ts
import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class PaymentController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getPayments = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.getPayments({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      invoiceId: req.query.invoiceId as string,
      enrollmentId: req.query.enrollmentId as string,
      classroomId: req.query.classroomId as string,
      academicYearId: req.query.academicYearId as string,
      paymentMethod: req.query.paymentMethod as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    });
    res.status(200).json(ApiResponse.success("Payments retrieved successfully.", result));
  });

  getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.getPaymentById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Payment retrieved successfully.", result));
  });

  getPaymentsByInvoice = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.getPaymentsByInvoice(this.getId(req.params.invoiceId));
    res.status(200).json(ApiResponse.success("Invoice payments retrieved successfully.", result));
  });

  getMyPayments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await paymentService.getMyPayments(req.user.id, {
      academicYearId: req.query.academicYearId as string,
    });
    res.status(200).json(ApiResponse.success("Your payments retrieved successfully.", result));
  });

  createPayment = asyncHandler(async (req: Request, res: Response) => {
    const result = await paymentService.createPayment(req.body, req.user?.id);
    res.status(201).json(ApiResponse.success("Payment recorded successfully.", result));
  });
}

export const paymentController = new PaymentController();