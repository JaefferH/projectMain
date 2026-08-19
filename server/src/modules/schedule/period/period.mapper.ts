// src/modules/schedule/period/period.mapper.ts
type SchedulePeriodWithRelations = {
  id: string;
  branchId: string;
  name: string;
  shortName: string | null;
  order: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    timetableEntries: number;
  };
};

export class SchedulePeriodMapper {
  static toResponse(period: SchedulePeriodWithRelations) {
    return {
      id: period.id,
      branchId: period.branchId,
      name: period.name,
      shortName: period.shortName,
      order: period.order,
      startTime: period.startTime,
      endTime: period.endTime,
      isBreak: period.isBreak,
      duration: this.calculateDuration(period.startTime, period.endTime),
      createdAt: period.createdAt,
      updatedAt: period.updatedAt,
      branch: period.branch ? {
        id: period.branch.id,
        name: period.branch.name,
        code: period.branch.code,
      } : undefined,
      stats: {
        timetableEntries: period._count?.timetableEntries || 0,
      },
    };
  }

  static toList(periods: SchedulePeriodWithRelations[]) {
    return periods.map((period) => this.toResponse(period));
  }

  private static calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  }
}