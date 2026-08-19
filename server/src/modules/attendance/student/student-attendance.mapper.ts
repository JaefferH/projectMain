// src/modules/attendance/student/student-attendance.mapper.ts
type StudentAttendanceSessionWithRelations = {
  id: string;
  homeroomTeacherId: string;
  classroomId: string;
  academicTermId: string;
  sessionDate: Date;
  topic: string | null;
  notes: string | null;
  isLocked: boolean;
  lockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  homeroomTeacher?: {
    teacher?: {
      id: string;
      fullName: string;
      employeeNumber: string | null;
    };
  };
  classroom?: {
    id: string;
    name: string;
  };
  academicTerm?: {
    id: string;
    name: string;
    academicYear?: {
      id: string;
      name: string;
    };
  };
  records?: StudentAttendanceRecordWithRelations[];
  _count?: {
    records: number;
  };
};

type StudentAttendanceRecordWithRelations = {
  id: string;
  attendanceSessionId: string;
  enrollmentId: string;
  status: string;
  remarks: string | null;
  checkInTime: Date | null;
  createdAt: Date;
  enrollment?: {
    id: string;
    student?: {
      id: string;
      fullName: string;
      registrationNumber: string | null;
      photoUrl: string | null;
    };
  };
};

export class StudentAttendanceMapper {
  static toSessionResponse(session: StudentAttendanceSessionWithRelations) {
    return {
      id: session.id,
      classroomId: session.classroomId,
      academicTermId: session.academicTermId,
      sessionDate: session.sessionDate,
      topic: session.topic,
      notes: session.notes,
      isLocked: session.isLocked,
      lockedAt: session.lockedAt,
      createdAt: session.createdAt,
      homeroomTeacher: session.homeroomTeacher?.teacher ? {
        id: session.homeroomTeacher.teacher.id,
        fullName: session.homeroomTeacher.teacher.fullName,
        employeeNumber: session.homeroomTeacher.teacher.employeeNumber,
      } : undefined,
      classroom: session.classroom ? {
        id: session.classroom.id,
        name: session.classroom.name,
      } : undefined,
      academicTerm: session.academicTerm ? {
        id: session.academicTerm.id,
        name: session.academicTerm.name,
        academicYear: session.academicTerm.academicYear?.name,
      } : undefined,
      stats: {
        totalRecords: session._count?.records || session.records?.length || 0,
        present: session.records?.filter(r => r.status === "PRESENT").length || 0,
        absent: session.records?.filter(r => r.status === "ABSENT").length || 0,
        late: session.records?.filter(r => r.status === "LATE").length || 0,
        excused: session.records?.filter(r => r.status === "EXCUSED").length || 0,
      },
    };
  }

  static toRecordResponse(record: StudentAttendanceRecordWithRelations) {
    return {
      id: record.id,
      attendanceSessionId: record.attendanceSessionId,
      enrollmentId: record.enrollmentId,
      status: record.status,
      remarks: record.remarks,
      checkInTime: record.checkInTime,
      createdAt: record.createdAt,
      student: record.enrollment?.student ? {
        id: record.enrollment.student.id,
        fullName: record.enrollment.student.fullName,
        registrationNumber: record.enrollment.student.registrationNumber,
        photoUrl: record.enrollment.student.photoUrl,
      } : undefined,
    };
  }

  static toSessionList(sessions: StudentAttendanceSessionWithRelations[]) {
    return sessions.map(s => this.toSessionResponse(s));
  }

  static toRecordList(records: StudentAttendanceRecordWithRelations[]) {
    return records.map(r => this.toRecordResponse(r));
  }
}