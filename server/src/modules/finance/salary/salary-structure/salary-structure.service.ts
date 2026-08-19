// src/modules/finance/salary/salary-structure/salary-structure.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../../shared/errors/AppError";
import { SalaryStructureMapper } from "./salary-structure.mapper";
import { CreateSalaryStructureDto, UpdateSalaryStructureDto } from "./salary-structure.validation";
import { CacheUtils } from "../../../../shared/utils/cache.utils";

class SalaryStructureService {
  async getSalaryStructures(params: {
    branchId?: string; profileId?: string; isActive?: boolean; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `salaryStructures:list:${page}:${limit}:${params.branchId || 'all'}:${params.profileId || 'all'}:${params.isActive ?? 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.profileId && { profileId: params.profileId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
      };

      const [structures, total] = await prisma.$transaction([
        prisma.salaryStructure.findMany({
          where, skip, take: limit,
          include: {
            profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } },
            branch: { select: { id: true, name: true } },
            salaryComponents: true,
            _count: { select: { salaryPayments: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.salaryStructure.count({ where }),
      ]);

      return { items: SalaryStructureMapper.toList(structures), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 300);
  }

  async getSalaryStructureById(id: string) {
    return CacheUtils.getOrSet(`salaryStructure:${id}`, async () => {
      const structure = await prisma.salaryStructure.findUnique({
        where: { id },
        include: {
          profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } },
          branch: { select: { id: true, name: true } },
          salaryComponents: true,
          salaryPayments: { take: 5, orderBy: { createdAt: "desc" } },
          _count: { select: { salaryPayments: true } },
        },
      });
      if (!structure) throw new AppError("Salary structure not found.", 404);
      return SalaryStructureMapper.toResponse(structure);
    }, 300);
  }

  async getMySalaryStructure(userId: string) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError("Profile not found.", 404);

    const cacheKey = `salaryStructure:my:${profile.id}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const structure = await prisma.salaryStructure.findFirst({
        where: { profileId: profile.id, isActive: true },
        include: { branch: { select: { id: true, name: true } }, salaryComponents: true, _count: { select: { salaryPayments: true } } },
        orderBy: { effectiveFrom: "desc" },
      });
      if (!structure) throw new AppError("No active salary structure found.", 404);
      return SalaryStructureMapper.toResponse(structure);
    }, 300);
  }

  async createSalaryStructure(data: CreateSalaryStructureDto) {
    const profile = await prisma.userProfile.findUnique({ where: { id: data.profileId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!profile) throw new AppError("Staff profile not found.", 404);
    const hasStaffRole = profile.user.role.some(r => ["TEACHER", "ADMIN", "SUPER_ADMIN"].includes(r.role.name));
    if (!hasStaffRole) throw new AppError("User does not have a staff role.", 400);

    const existing = await prisma.salaryStructure.findFirst({ where: { profileId: data.profileId, isActive: true } });
    if (existing) await prisma.salaryStructure.update({ where: { id: existing.id }, data: { isActive: false, effectiveTo: new Date() } });

    const structure = await prisma.salaryStructure.create({
      data: { profileId: data.profileId, branchId: data.branchId, basicSalary: data.basicSalary, currency: data.currency || "ETB", effectiveFrom: new Date(data.effectiveFrom), salaryComponents: data.components ? { create: data.components.map(c => ({ type: c.type as any, name: c.name, amount: c.amount, isPercentage: c.isPercentage ?? false })) } : undefined },
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } }, salaryComponents: true, _count: { select: { salaryPayments: true } } },
    });

    await this.invalidateSalaryStructureCaches(data.profileId);
    return SalaryStructureMapper.toResponse(structure);
  }

  async updateSalaryStructure(id: string, data: UpdateSalaryStructureDto) {
    const structure = await prisma.salaryStructure.findUnique({ where: { id } });
    if (!structure) throw new AppError("Salary structure not found.", 404);

    const updateData: any = {};
    if (data.basicSalary) updateData.basicSalary = data.basicSalary;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.effectiveTo !== undefined) updateData.effectiveTo = data.effectiveTo ? new Date(data.effectiveTo) : null;

    if (data.components) {
      await prisma.salaryComponent.deleteMany({ where: { salaryStructureId: id } });
      await prisma.salaryComponent.createMany({ data: data.components.map(c => ({ salaryStructureId: id, type: c.type as any, name: c.name, amount: c.amount, isPercentage: c.isPercentage ?? false })) });
    }

    const updated = await prisma.salaryStructure.update({
      where: { id }, data: updateData,
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } }, salaryComponents: true, _count: { select: { salaryPayments: true } } },
    });

    await this.invalidateSalaryStructureCaches(structure.profileId, id);
    return SalaryStructureMapper.toResponse(updated);
  }

  async deleteSalaryStructure(id: string) {
    const structure = await prisma.salaryStructure.findUnique({ where: { id }, include: { _count: { select: { salaryPayments: true } } } });
    if (!structure) throw new AppError("Salary structure not found.", 404);
    if (structure._count.salaryPayments > 0) throw new AppError("Cannot delete structure with existing salary payments.", 400);

    await prisma.salaryStructure.delete({ where: { id } });
    await this.invalidateSalaryStructureCaches(structure.profileId, id, true);
    return { message: "Salary structure deleted successfully." };
  }

  private async invalidateSalaryStructureCaches(profileId: string, structureId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = ['salaryStructures:list:*', `salaryStructure:my:${profileId}`, 'salaryPayments:*', 'dashboard:*'];
    if (structureId) keysToDelete.push(`salaryStructure:${structureId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const salaryStructureService = new SalaryStructureService();