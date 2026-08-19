// src/modules/finance/fee/fee-structure/fee-structure.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../../shared/errors/AppError";
import { FeeStructureMapper } from "./fee-structure.mapper";
import { CreateFeeStructureDto, UpdateFeeStructureDto, BulkCreateFeeStructureDto } from "./fee-structure.validation";
import { CacheUtils } from "../../../../shared/utils/cache.utils";

class FeeStructureService {
  async getFeeStructures(params: {
    academicYearId?: string; feeCategoryId?: string; branchId?: string; isOptional?: boolean; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `feeStructures:list:${page}:${limit}:${params.academicYearId || 'all'}:${params.feeCategoryId || 'all'}:${params.branchId || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.academicYearId && { academicYearId: params.academicYearId }),
        ...(params.feeCategoryId && { feeCategoryId: params.feeCategoryId }),
        ...(params.isOptional !== undefined && { isOptional: params.isOptional }),
        ...(params.branchId && { feeCategory: { branchId: params.branchId } }),
      };

      const [structures, total] = await prisma.$transaction([
        prisma.feeStructure.findMany({
          where, skip, take: limit,
          include: {
            academicYear: { select: { id: true, name: true, isCurrent: true } },
            feeCategory: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } },
            _count: { select: { invoices: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.feeStructure.count({ where }),
      ]);

      return { items: FeeStructureMapper.toList(structures), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 300);
  }

  async getFeeStructureById(id: string) {
    return CacheUtils.getOrSet(`feeStructure:${id}`, async () => {
      const structure = await prisma.feeStructure.findUnique({
        where: { id },
        include: {
          academicYear: { select: { id: true, name: true, isCurrent: true } },
          feeCategory: { select: { id: true, name: true, description: true, branch: { select: { id: true, name: true } } } },
          invoices: { select: { id: true, invoiceNumber: true, enrollmentId: true, amount: true, status: true }, take: 10, orderBy: { createdAt: "desc" } },
          _count: { select: { invoices: true } },
        },
      });
      if (!structure) throw new AppError("Fee structure not found.", 404);
      return FeeStructureMapper.toResponse(structure);
    }, 300);
  }

  async getFeeScheduleByAcademicYear(academicYearId: string, branchId?: string) {
    const cacheKey = `feeSchedule:${academicYearId}:${branchId || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const academicYear = await prisma.academicYear.findUnique({ where: { id: academicYearId }, select: { id: true, name: true } });
      if (!academicYear) throw new AppError("Academic year not found.", 404);

      const where: any = { academicYearId };
      if (branchId) where.feeCategory = { branchId };

      const structures = await prisma.feeStructure.findMany({
        where,
        include: { feeCategory: { select: { id: true, name: true, description: true, branch: { select: { id: true, name: true } } } }, _count: { select: { invoices: true } } },
        orderBy: { feeCategory: { name: "asc" } },
      });

      const mandatory: any[] = []; const optional: any[] = [];
      structures.forEach(s => {
        const item = { id: s.id, category: s.feeCategory, amount: Number(s.amount), dueDate: s.dueDate, isRecurring: s.isRecurring, recurringInterval: s.recurringInterval, invoiceCount: s._count.invoices };
        if (s.isOptional) optional.push(item); else mandatory.push(item);
      });

      const mandatoryTotal = mandatory.reduce((sum, s) => sum + s.amount, 0);
      const optionalTotal = optional.reduce((sum, s) => sum + s.amount, 0);

      return { academicYear, mandatoryFees: { items: mandatory, total: mandatoryTotal }, optionalFees: { items: optional, total: optionalTotal }, summary: { totalMandatory: mandatoryTotal, totalOptional: optionalTotal, grandTotal: mandatoryTotal + optionalTotal, totalCategories: structures.length } };
    }, 600);
  }

  async createFeeStructure(data: CreateFeeStructureDto) {
    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!academicYear) throw new AppError("Academic year not found.", 404);
    const feeCategory = await prisma.feeCategory.findUnique({ where: { id: data.feeCategoryId } });
    if (!feeCategory) throw new AppError("Fee category not found.", 404);
    if (!feeCategory.isActive) throw new AppError("Fee category is not active.", 400);

    const existing = await prisma.feeStructure.findUnique({ where: { academicYearId_feeCategoryId: { academicYearId: data.academicYearId, feeCategoryId: data.feeCategoryId } } });
    if (existing) throw new AppError("Fee structure for this category and academic year already exists.", 409);

    const structure = await prisma.feeStructure.create({
      data: { academicYearId: data.academicYearId, feeCategoryId: data.feeCategoryId, amount: data.amount, dueDate: data.dueDate ? new Date(data.dueDate) : null, isOptional: data.isOptional ?? false, isRecurring: data.isRecurring ?? false, recurringInterval: data.recurringInterval },
      include: { academicYear: { select: { id: true, name: true, isCurrent: true } }, feeCategory: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } }, _count: { select: { invoices: true } } },
    });

    await this.invalidateFeeStructureCaches(data.academicYearId);
    return FeeStructureMapper.toResponse(structure);
  }

  async bulkCreateFeeStructures(data: BulkCreateFeeStructureDto) {
    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId } });
    if (!academicYear) throw new AppError("Academic year not found.", 404);

    const results: { successful: any[]; failed: { amount: number; error: string }[] } = { successful: [], failed: [] };
    for (const struct of data.structures) {
      try {
        const feeCategoryId = struct.feeCategoryId || data.feeCategoryId;
        const feeCategory = await prisma.feeCategory.findUnique({ where: { id: feeCategoryId } });
        if (!feeCategory) { results.failed.push({ amount: struct.amount, error: "Fee category not found" }); continue; }

        const existing = await prisma.feeStructure.findUnique({ where: { academicYearId_feeCategoryId: { academicYearId: data.academicYearId, feeCategoryId } } });
        if (existing) { results.failed.push({ amount: struct.amount, error: `Structure already exists for ${feeCategory.name}` }); continue; }

        const created = await prisma.feeStructure.create({
          data: { academicYearId: data.academicYearId, feeCategoryId, amount: struct.amount, dueDate: struct.dueDate ? new Date(struct.dueDate) : null, isOptional: struct.isOptional ?? false, isRecurring: struct.isRecurring ?? false, recurringInterval: struct.recurringInterval },
          include: { academicYear: { select: { id: true, name: true, isCurrent: true } }, feeCategory: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } }, _count: { select: { invoices: true } } },
        });
        results.successful.push(FeeStructureMapper.toResponse(created));
      } catch (error: any) { results.failed.push({ amount: struct.amount, error: error.message }); }
    }

    if (results.successful.length > 0) await this.invalidateFeeStructureCaches(data.academicYearId);
    return { message: `Created ${results.successful.length} structures, ${results.failed.length} failed`, ...results };
  }

  async updateFeeStructure(id: string, data: UpdateFeeStructureDto) {
    const structure = await prisma.feeStructure.findUnique({ where: { id }, include: { _count: { select: { invoices: true } } } });
    if (!structure) throw new AppError("Fee structure not found.", 404);
    if (structure._count.invoices > 0 && data.amount && data.amount !== Number(structure.amount)) throw new AppError("Cannot change amount when invoices already exist.", 400);

    const updated = await prisma.feeStructure.update({
      where: { id },
      data: { ...(data.amount && { amount: data.amount }), ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }), ...(data.isOptional !== undefined && { isOptional: data.isOptional }), ...(data.isRecurring !== undefined && { isRecurring: data.isRecurring }), ...(data.recurringInterval !== undefined && { recurringInterval: data.recurringInterval }) },
      include: { academicYear: { select: { id: true, name: true, isCurrent: true } }, feeCategory: { select: { id: true, name: true, branch: { select: { id: true, name: true } } } }, _count: { select: { invoices: true } } },
    });

    await this.invalidateFeeStructureCaches(structure.academicYearId, id);
    return FeeStructureMapper.toResponse(updated);
  }

  async deleteFeeStructure(id: string) {
    const structure = await prisma.feeStructure.findUnique({ where: { id }, include: { _count: { select: { invoices: true } } } });
    if (!structure) throw new AppError("Fee structure not found.", 404);
    if (structure._count.invoices > 0) throw new AppError(`Cannot delete structure with ${structure._count.invoices} existing invoices.`, 400);

    await prisma.feeStructure.delete({ where: { id } });
    await this.invalidateFeeStructureCaches(structure.academicYearId, id, true);
    return { message: "Fee structure deleted successfully." };
  }

  private async invalidateFeeStructureCaches(academicYearId: string, structureId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = ['feeStructures:list:*', `feeSchedule:${academicYearId}:*`, 'invoices:*', 'dashboard:*'];
    if (structureId) keysToDelete.push(`feeStructure:${structureId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const feeStructureService = new FeeStructureService();