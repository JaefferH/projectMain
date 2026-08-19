// src/modules/attendance/staff/staff-attendance.mapper.ts
type StaffAttendanceWithRelations = {
  id: string;
  userId: string;
  profileId: string;
  branchId: string;
  attendanceDate: Date;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  status: string;
  remarks: string | null;
  isLocked: boolean;
  createdAt: Date;
  profile?: {
    id: string;
    fullName: string;
    employeeNumber: string | null;
    phone: string | null;
  };
  branch?: {
    id: string;
    name: string;
  };
};

export class StaffAttendanceMapper {
  static toResponse(record: StaffAttendanceWithRelations) {
    return {
      id: record.id,
      userId: record.userId,
      profileId: record.profileId,
      branchId: record.branchId,
      attendanceDate: record.attendanceDate,
      checkInTime: record.checkInTime,
      checkOutTime: record.checkOutTime,
      status: record.status,
      remarks: record.remarks,
      isLocked: record.isLocked,
      createdAt: record.createdAt,
      staff: record.profile ? {
        id: record.profile.id,
        fullName: record.profile.fullName,
        employeeNumber: record.profile.employeeNumber,
        phone: record.profile.phone,
      } : undefined,
      branch: record.branch ? {
        id: record.branch.id,
        name: record.branch.name,
      } : undefined,
    };
  }

  static toList(records: StaffAttendanceWithRelations[]) {
    return records.map(r => this.toResponse(r));
  }
}