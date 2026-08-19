// src/modules/finance/expense/expense.controller.ts
import { Request, Response } from "express";
import { expenseService } from "./expense.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class ExpenseController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  // Categories
  getExpenseCategories = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.getExpenseCategories({
      branchId: req.query.branchId as string,
      isActive: req.query.isActive !== undefined ? req.query.isActive === "true" : undefined,
    });
    res.status(200).json(ApiResponse.success("Expense categories retrieved successfully.", result));
  });

  createExpenseCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.createExpenseCategory(req.body);
    res.status(201).json(ApiResponse.success("Expense category created successfully.", result));
  });

  updateExpenseCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.updateExpenseCategory(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Expense category updated successfully.", result));
  });

  deleteExpenseCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.deleteExpenseCategory(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });

  // Expenses
  getExpenseSummary = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.getExpenseSummary({
      branchId: req.query.branchId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });
    res.status(200).json(ApiResponse.success("Expense summary retrieved successfully.", result));
  });

  getExpenses = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.getExpenses({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      branchId: req.query.branchId as string,
      categoryId: req.query.categoryId as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      search: req.query.search as string,
    });
    res.status(200).json(ApiResponse.success("Expenses retrieved successfully.", result));
  });

  getExpenseById = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.getExpenseById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Expense retrieved successfully.", result));
  });

  createExpense = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await expenseService.createExpense(req.body, req.user.id);
    res.status(201).json(ApiResponse.success("Expense recorded successfully.", result));
  });

  updateExpense = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.updateExpense(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Expense updated successfully.", result));
  });

  approveExpense = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await expenseService.approveExpense(this.getId(req.params.id), req.user.id, req.body?.notes);
    res.status(200).json(ApiResponse.success("Expense approved successfully.", result));
  });

  rejectExpense = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await expenseService.rejectExpense(this.getId(req.params.id), req.user.id, req.body?.notes);
    res.status(200).json(ApiResponse.success("Expense rejected successfully.", result));
  });

  deleteExpense = asyncHandler(async (req: Request, res: Response) => {
    const result = await expenseService.deleteExpense(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const expenseController = new ExpenseController();