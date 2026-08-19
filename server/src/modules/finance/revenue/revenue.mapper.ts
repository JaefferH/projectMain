// src/modules/finance/revenue/revenue.mapper.ts

type RevenueCategoryWithRelations = {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  branch?: { id: string; name: string; code: string };
  _count?: { revenues: number };
};

type RevenueWithRelations = {
  id: string;
  branchId: string;
  categoryId: string;
  receiptNumber: string | null;
  amount: any;
  receivedDate: Date;
  description: string | null;
  referenceNumber: string | null;
  receivedByUserId: string | null;
  createdAt: Date;
  branch?: { id: string; name: string };
  category?: { id: string; name: string };
  receivedBy?: { id: string; username: string };
};

export class RevenueMapper {
  static toCategoryResponse(category: RevenueCategoryWithRelations) {
    return {
      id: category.id,
      branchId: category.branchId,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      branch: category.branch,
      stats: { revenues: category._count?.revenues || 0 },
    };
  }

  static toCategoryList(categories: RevenueCategoryWithRelations[]) {
    return categories.map(c => this.toCategoryResponse(c));
  }

  static toResponse(revenue: RevenueWithRelations) {
    return {
      id: revenue.id,
      branchId: revenue.branchId,
      categoryId: revenue.categoryId,
      receiptNumber: revenue.receiptNumber,
      amount: Number(revenue.amount),
      receivedDate: revenue.receivedDate,
      description: revenue.description,
      referenceNumber: revenue.referenceNumber,
      receivedBy: revenue.receivedBy ? { id: revenue.receivedBy.id, username: revenue.receivedBy.username } : undefined,
      createdAt: revenue.createdAt,
      branch: revenue.branch,
      category: revenue.category,
    };
  }

  static toList(revenues: RevenueWithRelations[]) {
    return revenues.map(r => this.toResponse(r));
  }
}