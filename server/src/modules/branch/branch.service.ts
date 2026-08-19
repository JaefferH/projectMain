// src/modules/branch/branch.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../shared/errors/AppError";
import { BranchMapper } from "./branch.mapper";
import { CreateBranchDto, UpdateBranchDto } from "./branch.validation";
import { CacheUtils } from "../../shared/utils/cache.utils";

class BranchService {
  async getBranches(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    organizationId?: string;
    city?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    // Generate cache key from all params
    const cacheKey = `branches:list:${page}:${limit}:${params.search || 'all'}:${params.isActive ?? 'all'}:${params.organizationId || 'all'}:${params.city || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const where: any = {
          ...(params.isActive !== undefined && { isActive: params.isActive }),
          ...(params.organizationId && { organizationId: params.organizationId }),
          ...(params.city && { city: params.city }),
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { code: { contains: params.search, mode: "insensitive" as const } },
              { city: { contains: params.search, mode: "insensitive" as const } },
            ],
          }),
        };

        const [branches, total] = await prisma.$transaction([
          prisma.branch.findMany({
            where, skip, take: limit,
            include: {
              organization: { select: { id: true, name: true, code: true } },
              _count: {
                select: {
                  users: true,
                  userProfiles: true,
                  classrooms: true,
                  subjects: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.branch.count({ where }),
        ]);

        return {
          items: BranchMapper.toList(branches),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      300 // 5 minutes
    );
  }

  async getBranchById(id: string) {
    const cacheKey = `branch:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const branch = await prisma.branch.findUnique({
          where: { id },
          include: {
            organization: { select: { id: true, name: true, code: true } },
            _count: {
              select: {
                users: true,
                userProfiles: true,
                classrooms: true,
                subjects: true,
              },
            },
          },
        });

        if (!branch) throw new AppError("Branch not found.", 404);
        return BranchMapper.toResponse(branch);
      },
      600 // 10 minutes
    );
  }

  async getBranchesByOrganization(organizationId: string) {
    const cacheKey = `branches:org:${organizationId}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const organization = await prisma.organization.findUnique({
          where: { id: organizationId },
        });

        if (!organization) throw new AppError("Organization not found.", 404);

        const branches = await prisma.branch.findMany({
          where: { organizationId, isActive: true },
          include: {
            _count: {
              select: {
                users: true,
                userProfiles: true,
                classrooms: true,
                subjects: true,
              },
            },
          },
          orderBy: { isMainCampus: "desc" },
        });

        return BranchMapper.toList(branches);
      },
      600 // 10 minutes
    );
  }

  async createBranch(data: CreateBranchDto) {
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    });
    if (!organization) throw new AppError("Organization not found.", 404);

    const existingCode = await prisma.branch.findFirst({
      where: { organizationId: data.organizationId, code: data.code },
    });
    if (existingCode) throw new AppError("Branch code already exists in this organization.", 409);

    if (data.isMainCampus) {
      await prisma.branch.updateMany({
        where: { organizationId: data.organizationId, isMainCampus: true },
        data: { isMainCampus: false },
      });
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        code: data.code,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        region: data.region,
        country: data.country || "Ethiopia",
        isMainCampus: data.isMainCampus ?? false,
        isActive: data.isActive ?? true,
      },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        _count: { select: { users: true, userProfiles: true, classrooms: true, subjects: true } },
      },
    });

    // Invalidate related caches
    await this.invalidateBranchCaches(data.organizationId);

    return BranchMapper.toResponse(branch);
  }

  async updateBranch(id: string, data: UpdateBranchDto) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new AppError("Branch not found.", 404);

    if (data.code) {
      const existingCode = await prisma.branch.findFirst({
        where: { organizationId: branch.organizationId, code: data.code, NOT: { id } },
      });
      if (existingCode) throw new AppError("Branch code already exists in this organization.", 409);
    }

    if (data.isMainCampus) {
      await prisma.branch.updateMany({
        where: { organizationId: branch.organizationId, isMainCampus: true, NOT: { id } },
        data: { isMainCampus: false },
      });
    }

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data,
      include: {
        organization: { select: { id: true, name: true, code: true } },
        _count: { select: { users: true, userProfiles: true, classrooms: true, subjects: true } },
      },
    });

    // Invalidate related caches
    await this.invalidateBranchCaches(branch.organizationId, id);

    return BranchMapper.toResponse(updatedBranch);
  }

  async deleteBranch(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true, userProfiles: true, classrooms: true, subjects: true,
            expenses: true, expenseCategories: true, feeCategories: true,
            guardians: true, revenues: true, revenueCategories: true, schedulePeriods: true,
          },
        },
      },
    });

    if (!branch) throw new AppError("Branch not found.", 404);

    const relatedRecords: string[] = [];
    if (branch._count.users > 0) relatedRecords.push(`${branch._count.users} user(s)`);
    if (branch._count.userProfiles > 0) relatedRecords.push(`${branch._count.userProfiles} profile(s)`);
    if (branch._count.classrooms > 0) relatedRecords.push(`${branch._count.classrooms} classroom(s)`);
    if (branch._count.subjects > 0) relatedRecords.push(`${branch._count.subjects} subject(s)`);
    if (branch._count.expenses > 0) relatedRecords.push(`${branch._count.expenses} expense(s)`);
    if (branch._count.expenseCategories > 0) relatedRecords.push(`${branch._count.expenseCategories} expense categorie(s)`);
    if (branch._count.feeCategories > 0) relatedRecords.push(`${branch._count.feeCategories} fee categorie(s)`);
    if (branch._count.guardians > 0) relatedRecords.push(`${branch._count.guardians} guardian(s)`);
    if (branch._count.revenues > 0) relatedRecords.push(`${branch._count.revenues} revenue(s)`);
    if (branch._count.revenueCategories > 0) relatedRecords.push(`${branch._count.revenueCategories} revenue categorie(s)`);
    if (branch._count.schedulePeriods > 0) relatedRecords.push(`${branch._count.schedulePeriods} schedule period(s)`);

    if (relatedRecords.length > 0) {
      throw new AppError(
        `Cannot delete branch because it has the following related records: ${relatedRecords.join(", ")}. Please remove or reassign these records first.`,
        400
      );
    }

    await prisma.branch.delete({ where: { id } });

    // Invalidate related caches
    await this.invalidateBranchCaches(branch.organizationId, id);

    return { message: "Branch deleted permanently.", branchName: branch.name, branchCode: branch.code };
  }

  async softDeleteBranch(id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new AppError("Branch not found.", 404);
    if (!branch.isActive) throw new AppError("Branch is already deactivated.", 400);
    if (branch.isMainCampus) throw new AppError("Cannot deactivate the main campus. Set another branch as main campus first.", 400);

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: { isActive: false },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        _count: { select: { users: true, userProfiles: true, classrooms: true, subjects: true } },
      },
    });

    // Invalidate related caches
    await this.invalidateBranchCaches(branch.organizationId, id);

    return BranchMapper.toResponse(updatedBranch);
  }

  async deleteBranchWithReassign(branchId: string, reassignToBranchId: string, currentUser?: any) {
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { _count: { select: { users: true, userProfiles: true, classrooms: true, subjects: true } } },
    });
    if (!branch) throw new AppError("Branch not found.", 404);
    if (branch.isMainCampus) throw new AppError("Cannot delete the main campus.", 400);

    const targetBranch = await prisma.branch.findUnique({ where: { id: reassignToBranchId } });
    if (!targetBranch) throw new AppError("Target branch for reassignment not found.", 404);
    if (targetBranch.organizationId !== branch.organizationId) throw new AppError("Target branch must be in the same organization.", 400);
    if (!targetBranch.isActive) throw new AppError("Target branch must be active.", 400);
    if (branchId === reassignToBranchId) throw new AppError("Cannot reassign to the same branch.", 400);

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.userProfile.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.classroom.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.subject.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.expense.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.expenseCategory.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.feeCategory.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.guardian.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.revenue.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.revenueCategory.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.schedulePeriod.updateMany({ where: { branchId }, data: { branchId: reassignToBranchId } });
      await tx.branch.delete({ where: { id: branchId } });
    });

    // Invalidate related caches
    await this.invalidateBranchCaches(branch.organizationId, branchId, reassignToBranchId);

    return {
      message: `Branch deleted successfully. All records reassigned to ${targetBranch.name}.`,
      deletedBranch: { id: branch.id, name: branch.name, code: branch.code },
      reassignedTo: { id: targetBranch.id, name: targetBranch.name, code: targetBranch.code },
    };
  }

  async toggleBranchStatus(id: string) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const updatedBranch = await prisma.branch.update({
      where: { id },
      data: { isActive: !branch.isActive },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        _count: { select: { users: true, userProfiles: true, classrooms: true, subjects: true } },
      },
    });

    // Invalidate related caches
    await this.invalidateBranchCaches(branch.organizationId, id);

    return BranchMapper.toResponse(updatedBranch);
  }

  /**
   * Helper to invalidate all branch-related caches
   */
  private async invalidateBranchCaches(organizationId: string, branchId?: string, otherBranchId?: string) {
    const keysToDelete: string[] = [];
    
    // Invalidate branch list caches
    keysToDelete.push('branches:list:*');
    keysToDelete.push(`branches:org:${organizationId}`);
    
    // Invalidate specific branch cache
    if (branchId) {
      keysToDelete.push(`branch:${branchId}`);
    }
    
    // Invalidate other affected branch
    if (otherBranchId) {
      keysToDelete.push(`branch:${otherBranchId}`);
    }

    // Also invalidate organization cache since branch count changed
    keysToDelete.push(`organization:${organizationId}`);

    await Promise.all(keysToDelete.map(key => 
      key.endsWith('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }
}

export const branchService = new BranchService();