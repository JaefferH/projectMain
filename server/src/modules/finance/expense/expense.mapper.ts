// src/modules/finance/expense/expense.mapper.ts

type ExpenseCategoryWithRelations = {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  branch?: { id: string; name: string; code: string };
  _count?: { expenses: number };
};

type ExpenseWithRelations = {
  id: string;
  branchId: string;
  categoryId: string;
  voucherNumber: string | null;
  amount: any;
  expenseDate: Date;
  description: string | null;
  referenceNumber: string | null;
  status: string;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  createdByUserId: string;
  createdAt: Date;
  branch?: { id: string; name: string };
  category?: { id: string; name: string };
  createdBy?: { id: string; username: string };
  approvedBy?: { id: string; username: string };
};

export class ExpenseMapper {
  static toCategoryResponse(category: ExpenseCategoryWithRelations) {
    return {
      id: category.id,
      branchId: category.branchId,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      branch: category.branch,
      stats: { expenses: category._count?.expenses || 0 },
    };
  }

  static toCategoryList(categories: ExpenseCategoryWithRelations[]) {
    return categories.map(c => this.toCategoryResponse(c));
  }

  static toResponse(expense: ExpenseWithRelations) {
    return {
      id: expense.id,
      branchId: expense.branchId,
      categoryId: expense.categoryId,
      voucherNumber: expense.voucherNumber,
      amount: Number(expense.amount),
      expenseDate: expense.expenseDate,
      description: expense.description,
      referenceNumber: expense.referenceNumber,
      status: expense.status,
      approvedAt: expense.approvedAt,
      createdBy: expense.createdBy ? { id: expense.createdBy.id, username: expense.createdBy.username } : undefined,
      approvedBy: expense.approvedBy ? { id: expense.approvedBy.id, username: expense.approvedBy.username } : undefined,
      createdAt: expense.createdAt,
      branch: expense.branch,
      category: expense.category,
    };
  }

  static toList(expenses: ExpenseWithRelations[]) {
    return expenses.map(e => this.toResponse(e));
  }
}