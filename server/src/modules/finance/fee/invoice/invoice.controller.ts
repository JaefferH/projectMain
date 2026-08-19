// src/modules/finance/fee/invoice/invoice.controller.ts
import { Request, Response } from "express";
import { invoiceService } from "./invoice.service";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../../shared/responses/ApiResponse";
import { AppError } from "../../../../shared/errors/AppError";

class InvoiceController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getInvoices = asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.getInvoices({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      enrollmentId: req.query.enrollmentId as string,
      classroomId: req.query.classroomId as string,
      academicYearId: req.query.academicYearId as string,
      status: req.query.status as string,
      search: req.query.search as string,
    });
    res.status(200).json(ApiResponse.success("Invoices retrieved successfully.", result));
  });

  getInvoiceById = asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.getInvoiceById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Invoice retrieved successfully.", result));
  });

  getMyInvoices = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await invoiceService.getMyInvoices(req.user.id, {
      status: req.query.status as string,
      academicYearId: req.query.academicYearId as string,
    });
    res.status(200).json(ApiResponse.success("Your invoices retrieved successfully.", result));
  });

  generateInvoices = asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.generateInvoices(req.body);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  updateInvoice = asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.updateInvoice(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Invoice updated successfully.", result));
  });

  applyDiscount = asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.applyDiscount(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Discount applied successfully.", result));
  });

  cancelInvoice = asyncHandler(async (req: Request, res: Response) => {
    const result = await invoiceService.cancelInvoice(this.getId(req.params.id), req.body?.reason);
    res.status(200).json(ApiResponse.success("Invoice cancelled successfully.", result));
  });
}

export const invoiceController = new InvoiceController();