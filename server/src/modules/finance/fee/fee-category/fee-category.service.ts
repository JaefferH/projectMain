// src/modules/finance/fee/fee-category/fee-category.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../../shared/errors/AppError";
import { FeeCategoryMapper } from "./fee-category.mapper";
import { CreateFeeCategoryDto, UpdateFeeCategoryDto } from "./fee-category.validation";
import { CacheUtils } from "../../../../shared/utils/cache.utils";

class FeeCategoryService {
  async getFeeCategories(params: {
    branchId?: string; isActive?: boolean; search?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `feeCategories:list:${page}:${limit}:${params.branchId || 'all'}:${params.isActive ?? 'all'}:${params.search || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.search && { OR: [{ name: { contains: params.search, mode: "insensitive" as const } }, { description: { contains: params.search, mode: "insensitive" as const } }] }),
      };

      const [categories, total] = await prisma.$transaction([
        prisma.feeCategory.findMany({
          where, skip, take: limit,
          include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { feeStructures: true } } },
          orderBy: { name: "asc" },
        }),
        prisma.feeCategory.count({ where }),
      ]);

      return { items: FeeCategoryMapper.toList(categories), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 600);
  }

  async getFeeCategoryById(id: string) {
    return CacheUtils.getOrSet(`feeCategory:${id}`, async () => {
      const category = await prisma.feeCategory.findUnique({
        where: { id },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          feeStructures: { include: { academicYear: { select: { id: true, name: true } } }, orderBy: { academicYear: { startDate: "desc" } } },
          _count: { select: { feeStructures: true } },
        },
      });
      if (!category) throw new AppError("Fee category not found.", 404);
      return { ...FeeCategoryMapper.toResponse(category), feeStructures: category.feeStructures.map(fs => ({ id: fs.id, academicYearId: fs.academicYearId, academicYear: fs.academicYear.name, amount: Number(fs.amount), dueDate: fs.dueDate, isOptional: fs.isOptional })) };
    }, 600);
  }

  async createFeeCategory(data: CreateFeeCategoryDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const existing = await prisma.feeCategory.findFirst({ where: { branchId: data.branchId, name: data.name } });
    if (existing) throw new AppError("Fee category with this name already exists in this branch.", 409);

    const category = await prisma.feeCategory.create({
      data: { branchId: data.branchId, name: data.name, description: data.description, isActive: data.isActive ?? true },
      include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { feeStructures: true } } },
    });

    await CacheUtils.invalidatePattern('feeCategories:list:*');
    return FeeCategoryMapper.toResponse(category);
  }

  async updateFeeCategory(id: string, data: UpdateFeeCategoryDto) {
    const category = await prisma.feeCategory.findUnique({ where: { id } });
    if (!category) throw new AppError("Fee category not found.", 404);

    if (data.name) {
      const existing = await prisma.feeCategory.findFirst({ where: { branchId: category.branchId, name: data.name, NOT: { id } } });
      if (existing) throw new AppError("Fee category with this name already exists in this branch.", 409);
    }

    const updated = await prisma.feeCategory.update({
      where: { id },
      data: { ...(data.name && { name: data.name }), ...(data.description !== undefined && { description: data.description }), ...(data.isActive !== undefined && { isActive: data.isActive }) },
      include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { feeStructures: true } } },
    });

    await Promise.all([CacheUtils.delete(`feeCategory:${id}`), CacheUtils.invalidatePattern('feeCategories:list:*')]);
    return FeeCategoryMapper.toResponse(updated);
  }

  async deleteFeeCategory(id: string) {
    const category = await prisma.feeCategory.findUnique({ where: { id }, include: { _count: { select: { feeStructures: true } } } });
    if (!category) throw new AppError("Fee category not found.", 404);
    if (category._count.feeStructures > 0) throw new AppError("Cannot delete category with existing fee structures. Deactivate it instead.", 400);

    await prisma.feeCategory.delete({ where: { id } });
    await Promise.all([CacheUtils.delete(`feeCategory:${id}`), CacheUtils.invalidatePattern('feeCategories:list:*')]);
    return { message: "Fee category deleted successfully." };
  }

  async toggleStatus(id: string) {
    const category = await prisma.feeCategory.findUnique({ where: { id } });
    if (!category) throw new AppError("Fee category not found.", 404);

    const updated = await prisma.feeCategory.update({
      where: { id }, data: { isActive: !category.isActive },
      include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { feeStructures: true } } },
    });

    await Promise.all([CacheUtils.delete(`feeCategory:${id}`), CacheUtils.invalidatePattern('feeCategories:list:*')]);
    return FeeCategoryMapper.toResponse(updated);
  }
}

export const feeCategoryService = new FeeCategoryService();