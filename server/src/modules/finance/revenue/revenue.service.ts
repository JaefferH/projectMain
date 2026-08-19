// src/modules/finance/revenue/revenue.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { RevenueMapper } from "./revenue.mapper";
import { CreateRevenueCategoryDto, UpdateRevenueCategoryDto, CreateRevenueDto, UpdateRevenueDto } from "./revenue.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class RevenueService {
  // ==================== CATEGORIES ====================
  
  async getRevenueCategories(params: { branchId?: string; isActive?: boolean }) {
    const cacheKey = `revenueCategories:${params.branchId || 'all'}:${params.isActive ?? 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { ...(params.branchId && { branchId: params.branchId }), ...(params.isActive !== undefined && { isActive: params.isActive }) };
      const categories = await prisma.revenueCategory.findMany({ where, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { revenues: true } } }, orderBy: { name: "asc" } });
      return RevenueMapper.toCategoryList(categories);
    }, 600);
  }

  async createRevenueCategory(data: CreateRevenueCategoryDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);
    const existing = await prisma.revenueCategory.findFirst({ where: { branchId: data.branchId, name: data.name } });
    if (existing) throw new AppError("Revenue category with this name already exists.", 409);

    const category = await prisma.revenueCategory.create({ data: { branchId: data.branchId, name: data.name, description: data.description }, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { revenues: true } } } });
    await CacheUtils.invalidatePattern('revenueCategories:*');
    return RevenueMapper.toCategoryResponse(category);
  }

  async updateRevenueCategory(id: string, data: UpdateRevenueCategoryDto) {
    const category = await prisma.revenueCategory.findUnique({ where: { id } });
    if (!category) throw new AppError("Revenue category not found.", 404);
    if (data.name) { const existing = await prisma.revenueCategory.findFirst({ where: { branchId: category.branchId, name: data.name, NOT: { id } } }); if (existing) throw new AppError("Revenue category with this name already exists.", 409); }

    const updated = await prisma.revenueCategory.update({ where: { id }, data: { ...(data.name && { name: data.name }), ...(data.description !== undefined && { description: data.description }), ...(data.isActive !== undefined && { isActive: data.isActive }) }, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { revenues: true } } } });
    await CacheUtils.invalidatePattern('revenueCategories:*');
    return RevenueMapper.toCategoryResponse(updated);
  }

  async deleteRevenueCategory(id: string) {
    const category = await prisma.revenueCategory.findUnique({ where: { id }, include: { _count: { select: { revenues: true } } } });
    if (!category) throw new AppError("Revenue category not found.", 404);
    if (category._count.revenues > 0) throw new AppError("Cannot delete category with existing revenues.", 400);
    await prisma.revenueCategory.delete({ where: { id } });
    await CacheUtils.invalidatePattern('revenueCategories:*');
    return { message: "Revenue category deleted successfully." };
  }

  // ==================== REVENUES ====================

  async getRevenues(params: { branchId?: string; categoryId?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `revenues:list:${page}:${limit}:${params.branchId || 'all'}:${params.categoryId || 'all'}:${params.startDate || 'all'}:${params.endDate || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = { ...(params.branchId && { branchId: params.branchId }), ...(params.categoryId && { categoryId: params.categoryId }), ...(params.startDate && params.endDate && { receivedDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }), ...(params.search && { OR: [{ description: { contains: params.search, mode: "insensitive" as const } }, { referenceNumber: { contains: params.search, mode: "insensitive" as const } }] }) };

      const [revenues, total] = await prisma.$transaction([prisma.revenue.findMany({ where, skip, take: limit, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, receivedBy: { select: { id: true, username: true } } }, orderBy: { receivedDate: "desc" } }), prisma.revenue.count({ where })]);
      const totalAmount = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
      return { items: RevenueMapper.toList(revenues), summary: { totalRevenues: total, totalAmount }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async getRevenueById(id: string) {
    return CacheUtils.getOrSet(`revenue:${id}`, async () => {
      const revenue = await prisma.revenue.findUnique({ where: { id }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, receivedBy: { select: { id: true, username: true } } } });
      if (!revenue) throw new AppError("Revenue not found.", 404);
      return RevenueMapper.toResponse(revenue);
    }, 300);
  }

  async getRevenueSummary(params: { branchId?: string; startDate?: string; endDate?: string }) {
    const cacheKey = `revenues:summary:${params.branchId || 'all'}:${params.startDate || 'all'}:${params.endDate || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { ...(params.branchId && { branchId: params.branchId }), ...(params.startDate && params.endDate && { receivedDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }) };
      const revenues = await prisma.revenue.findMany({ where, include: { category: { select: { id: true, name: true } } } });
      const byCategory: Record<string, { categoryName: string; count: number; total: number }> = {};
      revenues.forEach(r => { const catId = r.categoryId; if (!byCategory[catId]) byCategory[catId] = { categoryName: r.category?.name || "Unknown", count: 0, total: 0 }; byCategory[catId].count++; byCategory[catId].total += Number(r.amount); });
      return { totalAmount: revenues.reduce((sum, r) => sum + Number(r.amount), 0), totalCount: revenues.length, byCategory: Object.values(byCategory) };
    }, 300);
  }

  async createRevenue(data: CreateRevenueDto, userId?: string) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);
    const category = await prisma.revenueCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError("Revenue category not found.", 404);

    const year = new Date().getFullYear();
    const lastRevenue = await prisma.revenue.findFirst({ where: { receiptNumber: { startsWith: `REV-${branch.code}` } }, orderBy: { receiptNumber: "desc" }, select: { receiptNumber: true } });
    let sequence = 1;
    if (lastRevenue?.receiptNumber) { const parts = lastRevenue.receiptNumber.split('-'); sequence = parseInt(parts[parts.length - 1] || '0') + 1; }
    const receiptNumber = `REV-${branch.code}-${year}-${String(sequence).padStart(4, '0')}`;

    const revenue = await prisma.revenue.create({ data: { branchId: data.branchId, categoryId: data.categoryId, receiptNumber, amount: data.amount, receivedDate: new Date(data.receivedDate), description: data.description, referenceNumber: data.referenceNumber, receivedByUserId: userId }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, receivedBy: { select: { id: true, username: true } } } });

    await this.invalidateRevenueCaches(data.branchId);
    return RevenueMapper.toResponse(revenue);
  }

  async updateRevenue(id: string, data: UpdateRevenueDto) {
    const revenue = await prisma.revenue.findUnique({ where: { id } });
    if (!revenue) throw new AppError("Revenue not found.", 404);
    const updated = await prisma.revenue.update({ where: { id }, data: { ...(data.amount && { amount: data.amount }), ...(data.receivedDate && { receivedDate: new Date(data.receivedDate) }), ...(data.description !== undefined && { description: data.description }), ...(data.referenceNumber !== undefined && { referenceNumber: data.referenceNumber }) }, include: { branch: { select: { id: true, name: true } }, category: { select: { id: true, name: true } }, receivedBy: { select: { id: true, username: true } } } });
    await this.invalidateRevenueCaches(revenue.branchId, id);
    return RevenueMapper.toResponse(updated);
  }

  async deleteRevenue(id: string) {
    const revenue = await prisma.revenue.findUnique({ where: { id } });
    if (!revenue) throw new AppError("Revenue not found.", 404);
    await prisma.revenue.delete({ where: { id } });
    await this.invalidateRevenueCaches(revenue.branchId, id, true);
    return { message: "Revenue deleted successfully." };
  }

  private async invalidateRevenueCaches(branchId: string, revenueId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = ['revenues:list:*', 'revenues:summary:*', 'dashboard:*', 'financialReports:*'];
    if (revenueId) keysToDelete.push(`revenue:${revenueId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const revenueService = new RevenueService();