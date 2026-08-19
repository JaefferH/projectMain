// src/modules/schedule/timetable/timetable.mapper.ts
type TimetableEntryWithRelations = {
  id: string;
  teacherAssignmentId: string;
  schedulePeriodId: string;
  classroomId: string;
  dayOfWeek: string;
  room: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  schedulePeriod?: {
    id: string;
    name: string;
    shortName: string | null;
    order: number;
    startTime: string;
    endTime: string;
    isBreak: boolean;
  };
  teacherAssignment?: {
    id: string;
    weeklyPeriods: number | null;
    teacher?: {
      id: string;
      fullName: string;
      employeeNumber: string | null;
    };
    subject?: {
      id: string;
      name: string;
      code: string;
    };
  };
  classroom?: {
    id: string;
    name: string;
    capacity: number | null;
    branch?: {
      id: string;
      name: string;
    };
  };
};

export class TimetableMapper {
  static toResponse(entry: TimetableEntryWithRelations) {
    return {
      id: entry.id,
      teacherAssignmentId: entry.teacherAssignmentId,
      schedulePeriodId: entry.schedulePeriodId,
      classroomId: entry.classroomId,
      dayOfWeek: entry.dayOfWeek,
      room: entry.room,
      isActive: entry.isActive,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      period: entry.schedulePeriod ? {
        id: entry.schedulePeriod.id,
        name: entry.schedulePeriod.name,
        shortName: entry.schedulePeriod.shortName,
        order: entry.schedulePeriod.order,
        startTime: entry.schedulePeriod.startTime,
        endTime: entry.schedulePeriod.endTime,
        isBreak: entry.schedulePeriod.isBreak,
      } : undefined,
      teacher: entry.teacherAssignment?.teacher ? {
        id: entry.teacherAssignment.teacher.id,
        fullName: entry.teacherAssignment.teacher.fullName,
        employeeNumber: entry.teacherAssignment.teacher.employeeNumber,
      } : undefined,
      subject: entry.teacherAssignment?.subject ? {
        id: entry.teacherAssignment.subject.id,
        name: entry.teacherAssignment.subject.name,
        code: entry.teacherAssignment.subject.code,
      } : undefined,
      classroom: entry.classroom ? {
        id: entry.classroom.id,
        name: entry.classroom.name,
        capacity: entry.classroom.capacity,
        branchName: entry.classroom.branch?.name,
      } : undefined,
    };
  }

  static toList(entries: TimetableEntryWithRelations[]) {
    return entries.map((entry) => this.toResponse(entry));
  }
}