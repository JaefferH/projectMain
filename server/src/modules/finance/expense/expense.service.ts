// src/modules/finance/expense/expense.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { ExpenseMapper } from "./expense.mapper";
import { CreateExpenseCategoryDto, UpdateExpenseCategoryDto, CreateExpenseDto, UpdateExpenseDto } from "./expense.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class ExpenseService {
  // ==================== CATEGORIES ====================

  async getExpenseCategories(params: { branchId?: string; isActive?: boolean }) {
    const cacheKey = `expenseCategories:${params.branchId || 'all'}:${params.isActive ?? 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { ...(params.branchId && { branchId: params.branchId }), ...(params.isActive !== undefined && { isActive: params.isActive }) };
      const categories = await prisma.expenseCategory.findMany({ where, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { expenses: true } } }, orderBy: { name: "asc" } });
      return ExpenseMapper.toCategoryList(categories);
    }, 600);
  }

  async createExpenseCategory(data: CreateExpenseCategoryDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);
    const existing = await prisma.expenseCategory.findFirst({ where: { branchId: data.branchId, name: data.name } });
    if (existing) throw new AppError("Expense category with this name already exists.", 409);
    const category = await prisma.expenseCategory.create({ data: { branchId: data.branchId, name: data.name, description: data.description }, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { expenses: true } } } });
    await CacheUtils.invalidatePattern('expenseCategories:*');
    return ExpenseMapper.toCategoryResponse(category);
  }

  async updateExpenseCategory(id: string, data: UpdateExpenseCategoryDto) {
    const category = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!category) throw new AppError("Expense category not found.", 404);
    if (data.name) { const existing = await prisma.expenseCategory.findFirst({ where: { branchId: category.branchId, name: data.name, NOT: { id } } }); if (existing) throw new AppError("Expense category with this name already exists.", 409); }
    const updated = await prisma.expenseCategory.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.description !== undefined && { description: data.description }), ...(data.isActive !== undefined && { isActive: data.isActive }) }, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { expenses: true } } } });
    await CacheUtils.invalidatePattern('expenseCategories:*');
    return ExpenseMapper.toCategoryResponse(updated);
  }

  async deleteExpenseCategory(id: string) {
    const category = await prisma.expenseCategory.findUnique({ where: { id }, include: { _count: { select: { expenses: true } } } });
    if (!category) throw new AppError("Expense category not found.", 404);
    if (category._count.expenses > 0) throw new AppError("Cannot delete category with existing expenses.", 400);
    await prisma.expenseCategory.delete({ where: { id } });
    await CacheUtils.invalidatePattern('expenseCategories:*');
    return { message: "Expense category deleted successfully." };
  }

  // ==================== EXPENSES ====================

  async getExpenses(params: { branchId?: string; categoryId?: string; status?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `expenses:list:${page}:${limit}:${params.branchId || 'all'}:${params.categoryId || 'all'}:${params.status || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = { ...(params.branchId && { branchId: params.branchId }), ...(params.categoryId && { categoryId: params.categoryId }), ...(params.status && { status: params.status }), ...(params.startDate && params.endDate && { expenseDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }), ...(params.search && { OR: [{ description: { contains: params.search, mode: "insensitive" as const } }, { referenceNumber: { contains: params.search, mode: "insensitive" as const } }, { voucherNumber: { contains: params.search, mode: "insensitive" as const } }] }) };
      const [expenses, total] = await prisma.$transaction([prisma.expense.findMany({ where, skip, take: limit, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, createdBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } }, orderBy: { expenseDate: "desc" } }), prisma.expense.count({ where })]);
      const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      return { items: ExpenseMapper.toList(expenses), summary: { totalExpenses: total, totalAmount }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async getExpenseById(id: string) {
    return CacheUtils.getOrSet(`expense:${id}`, async () => {
      const expense = await prisma.expense.findUnique({ where: { id }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, createdBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } } });
      if (!expense) throw new AppError("Expense not found.", 404);
      return ExpenseMapper.toResponse(expense);
    }, 300);
  }

  async getExpenseSummary(params: { branchId?: string; startDate?: string; endDate?: string }) {
    const cacheKey = `expenses:summary:${params.branchId || 'all'}:${params.startDate || 'all'}:${params.endDate || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { status: "APPROVED", ...(params.branchId && { branchId: params.branchId }), ...(params.startDate && params.endDate && { expenseDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }) };
      const expenses = await prisma.expense.findMany({ where, include: { category: { select: { id: true, name: true } } } });
      const byCategory: Record<string, { categoryName: string; count: number; total: number }> = {};
      expenses.forEach(e => { const catId = e.categoryId; if (!byCategory[catId]) byCategory[catId] = { categoryName: e.category?.name || "Unknown", count: 0, total: 0 }; byCategory[catId].count++; byCategory[catId].total += Number(e.amount); });
      const pendingExpenses = await prisma.expense.findMany({ where: { ...where, status: "PENDING" } });
      return { approved: { totalAmount: expenses.reduce((sum, e) => sum + Number(e.amount), 0), totalCount: expenses.length, byCategory: Object.values(byCategory) }, pending: { totalAmount: pendingExpenses.reduce((sum, e) => sum + Number(e.amount), 0), totalCount: pendingExpenses.length } };
    }, 300);
  }

  async createExpense(data: CreateExpenseDto, userId: string) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);
    const category = await prisma.expenseCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError("Expense category not found.", 404);

    const year = new Date().getFullYear();
    const lastExpense = await prisma.expense.findFirst({ where: { voucherNumber: { startsWith: `VCH-${branch.code}` } }, orderBy: { voucherNumber: "desc" }, select: { voucherNumber: true } });
    let sequence = 1;
    if (lastExpense?.voucherNumber) { const parts = lastExpense.voucherNumber.split('-'); sequence = parseInt(parts[parts.length - 1] || '0') + 1; }
    const voucherNumber = `VCH-${branch.code}-${year}-${String(sequence).padStart(4, '0')}`;

    const expense = await prisma.expense.create({ data: { branchId: data.branchId, categoryId: data.categoryId, voucherNumber, amount: data.amount, expenseDate: new Date(data.expenseDate), description: data.description, referenceNumber: data.referenceNumber, status: "PENDING", createdByUserId: userId }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, createdBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } } });
    await this.invalidateExpenseCaches(data.branchId);
    return ExpenseMapper.toResponse(expense);
  }

  async updateExpense(id: string, data: UpdateExpenseDto) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new AppError("Expense not found.", 404);
    if (expense.status === "APPROVED") throw new AppError("Cannot update an approved expense.", 400);
    const updated = await prisma.expense.update({ where: { id }, data: { ...(data.amount && { amount: data.amount }), ...(data.expenseDate && { expenseDate: new Date(data.expenseDate) }), ...(data.description !== undefined && { description: data.description }), ...(data.referenceNumber !== undefined && { referenceNumber: data.referenceNumber }) }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, createdBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } } });
    await this.invalidateExpenseCaches(expense.branchId, id);
    return ExpenseMapper.toResponse(updated);
  }

  async approveExpense(id: string, userId: string, notes?: string) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new AppError("Expense not found.", 404);
    if (expense.status === "APPROVED") throw new AppError("Expense is already approved.", 400);
    if (expense.status === "REJECTED") throw new AppError("Cannot approve a rejected expense.", 400);
    const updated = await prisma.expense.update({ where: { id }, data: { status: "APPROVED", approvedByUserId: userId, approvedAt: new Date(), description: notes ? `${expense.description || ''}\nApproval note: ${notes}` : expense.description }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, createdBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } } });
    await this.invalidateExpenseCaches(expense.branchId, id);
    return ExpenseMapper.toResponse(updated);
  }

  async rejectExpense(id: string, userId: string, notes: string) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new AppError("Expense not found.", 404);
    if (expense.status === "APPROVED") throw new AppError("Cannot reject an approved expense.", 400);
    if (expense.status === "REJECTED") throw new AppError("Expense is already rejected.", 400);
    const updated = await prisma.expense.update({ where: { id }, data: { status: "REJECTED", approvedByUserId: userId, description: `${expense.description || ''}\nRejection reason: ${notes}` }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, createdBy: { select: { id: true, username: true } }, approvedBy: { select: { id: true, username: true } } } });
    await this.invalidateExpenseCaches(expense.branchId, id);
    return ExpenseMapper.toResponse(updated);
  }

  async deleteExpense(id: string) {
    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense) throw new AppError("Expense not found.", 404);
    if (expense.status === "APPROVED") throw new AppError("Cannot delete an approved expense.", 400);
    await prisma.expense.delete({ where: { id } });
    await this.invalidateExpenseCaches(expense.branchId, id, true);
    return { message: "Expense deleted successfully." };
  }

  private async invalidateExpenseCaches(branchId: string, expenseId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = ['expenses:list:*', 'expenses:summary:*', 'dashboard:*', 'financialReports:*'];
    if (expenseId) keysToDelete.push(`expense:${expenseId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const expenseService = new ExpenseService();