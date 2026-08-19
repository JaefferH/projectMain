// src/modules/schedule/period/period.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { SchedulePeriodMapper } from "./period.mapper";
import { CreatePeriodDto, UpdatePeriodDto, BulkCreatePeriodsDto } from "./period.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class SchedulePeriodService {
  async getPeriods(params: { branchId?: string; isBreak?: boolean }) {
    const cacheKey = `schedulePeriods:${params.branchId || 'all'}:${params.isBreak ?? 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.isBreak !== undefined && { isBreak: params.isBreak }),
      };

      const periods = await prisma.schedulePeriod.findMany({
        where,
        include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { timetableEntries: true } } },
        orderBy: { order: "asc" },
      });

      return SchedulePeriodMapper.toList(periods);
    }, 600); // 10 minutes - periods rarely change
  }

  async getPeriodById(id: string) {
    return CacheUtils.getOrSet(`schedulePeriod:${id}`, async () => {
      const period = await prisma.schedulePeriod.findUnique({
        where: { id },
        include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { timetableEntries: true } } },
      });
      if (!period) throw new AppError("Schedule period not found.", 404);
      return SchedulePeriodMapper.toResponse(period);
    }, 600);
  }

  async createPeriod(data: CreatePeriodDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const existingOrder = await prisma.schedulePeriod.findFirst({ where: { branchId: data.branchId, order: data.order } });
    if (existingOrder) throw new AppError("A period with this order already exists in this branch.", 409);
    if (data.startTime >= data.endTime) throw new AppError("End time must be after start time.", 400);

    const overlappingPeriod = await prisma.schedulePeriod.findFirst({
      where: { branchId: data.branchId, OR: [{ startTime: { lt: data.endTime }, endTime: { gt: data.startTime } }] },
    });
    if (overlappingPeriod) throw new AppError(`Period overlaps with existing period "${overlappingPeriod.name}".`, 409);

    const period = await prisma.schedulePeriod.create({
      data: { branchId: data.branchId, name: data.name, shortName: data.shortName, order: data.order, startTime: data.startTime, endTime: data.endTime, isBreak: data.isBreak ?? false },
      include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { timetableEntries: true } } },
    });

    await this.invalidatePeriodCaches(data.branchId);
    return SchedulePeriodMapper.toResponse(period);
  }

  async bulkCreatePeriods(data: BulkCreatePeriodsDto) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    await prisma.schedulePeriod.deleteMany({ where: { branchId: data.branchId } });

    const periods = await prisma.$transaction(
      data.periods.map((period) =>
        prisma.schedulePeriod.create({ data: { branchId: data.branchId, name: period.name, shortName: period.shortName, order: period.order, startTime: period.startTime, endTime: period.endTime, isBreak: period.isBreak ?? false } })
      )
    );

    await this.invalidatePeriodCaches(data.branchId);

    return {
      message: `Created ${periods.length} periods successfully.`,
      periods: SchedulePeriodMapper.toList(
        await prisma.schedulePeriod.findMany({ where: { branchId: data.branchId }, include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { timetableEntries: true } } }, orderBy: { order: "asc" } })
      ),
    };
  }

  async updatePeriod(id: string, data: UpdatePeriodDto) {
    const period = await prisma.schedulePeriod.findUnique({ where: { id } });
    if (!period) throw new AppError("Schedule period not found.", 404);

    if (data.order) {
      const existingOrder = await prisma.schedulePeriod.findFirst({ where: { branchId: period.branchId, order: data.order, NOT: { id } } });
      if (existingOrder) throw new AppError("A period with this order already exists in this branch.", 409);
    }

    const startTime = data.startTime || period.startTime;
    const endTime = data.endTime || period.endTime;
    if (startTime >= endTime) throw new AppError("End time must be after start time.", 400);

    const overlappingPeriod = await prisma.schedulePeriod.findFirst({ where: { branchId: period.branchId, NOT: { id }, OR: [{ startTime: { lt: endTime }, endTime: { gt: startTime } }] } });
    if (overlappingPeriod) throw new AppError(`Period overlaps with existing period "${overlappingPeriod.name}".`, 409);

    const updatedPeriod = await prisma.schedulePeriod.update({
      where: { id },
      data: { ...(data.name && { name: data.name }), ...(data.shortName !== undefined && { shortName: data.shortName }), ...(data.order && { order: data.order }), ...(data.startTime && { startTime: data.startTime }), ...(data.endTime && { endTime: data.endTime }), ...(data.isBreak !== undefined && { isBreak: data.isBreak }) },
      include: { branch: { select: { id: true, name: true, code: true } }, _count: { select: { timetableEntries: true } } },
    });

    await this.invalidatePeriodCaches(period.branchId, id);
    return SchedulePeriodMapper.toResponse(updatedPeriod);
  }

  async deletePeriod(id: string) {
    const period = await prisma.schedulePeriod.findUnique({ where: { id }, include: { _count: { select: { timetableEntries: true } } } });
    if (!period) throw new AppError("Schedule period not found.", 404);
    if (period._count.timetableEntries > 0) throw new AppError("Cannot delete period with existing timetable entries.", 400);

    await prisma.schedulePeriod.delete({ where: { id } });
    await this.invalidatePeriodCaches(period.branchId, id, true);
    return { message: "Schedule period deleted successfully." };
  }

  private async invalidatePeriodCaches(branchId: string, periodId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      `schedulePeriods:${branchId}:*`,
      'schedulePeriods:all:*',
      'timetable:*',
    ];
    if (periodId) keysToDelete.push(`schedulePeriod:${periodId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const schedulePeriodService = new SchedulePeriodService();