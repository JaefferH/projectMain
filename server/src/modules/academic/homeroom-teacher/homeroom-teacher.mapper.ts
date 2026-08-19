// src/modules/academic/homeroom-teacher/homeroom-teacher.mapper.ts
type HomeroomTeacherWithRelations = {
  id: string;
  teacherId: string;
  classroomId: string;
  academicTermId: string;
  isActive: boolean;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  teacher?: {
    id: string;
    fullName: string;
    employeeNumber: string | null;
    phone: string | null;
    email: string | null;
    photoUrl: string | null;
  };
  classroom?: {
    id: string;
    name: string;
    capacity: number | null;
    branch?: {
      id: string;
      name: string;
    };
    _count?: {
      studentEnrollments: number;
    };
  };
  academicTerm?: {
    id: string;
    name: string;
    type: string;
    startDate: Date;
    endDate: Date;
    academicYear?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    attendanceSessions: number;
  };
};

export class HomeroomTeacherMapper {
  static toResponse(assignment: HomeroomTeacherWithRelations) {
    return {
      id: assignment.id,
      teacherId: assignment.teacherId,
      classroomId: assignment.classroomId,
      academicTermId: assignment.academicTermId,
      isActive: assignment.isActive,
      assignedAt: assignment.assignedAt,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      teacher: assignment.teacher ? {
        id: assignment.teacher.id,
        fullName: assignment.teacher.fullName,
        employeeNumber: assignment.teacher.employeeNumber,
        phone: assignment.teacher.phone,
        email: assignment.teacher.email,
        photoUrl: assignment.teacher.photoUrl,
      } : undefined,
      classroom: assignment.classroom ? {
        id: assignment.classroom.id,
        name: assignment.classroom.name,
        capacity: assignment.classroom.capacity,
        branchName: assignment.classroom.branch?.name,
        studentCount: assignment.classroom._count?.studentEnrollments || 0,
        attendanceSessionCount: assignment.classroom._count?.attendanceSessions || 0,
      } : undefined,
      academicTerm: assignment.academicTerm ? {
        id: assignment.academicTerm.id,
        name: assignment.academicTerm.name,
        type: assignment.academicTerm.type,
        startDate: assignment.academicTerm.startDate,
        endDate: assignment.academicTerm.endDate,
        academicYear: assignment.academicTerm.academicYear?.name,
      } : undefined,
      stats: {
        attendanceSessions: assignment._count?.attendanceSessions || 0,
        students: assignment.classroom?._count?.studentEnrollments || 0,
      },
    };
  }

  static toList(assignments: HomeroomTeacherWithRelations[]) {
    return assignments.map((assignment) => this.toResponse(assignment));
  }

  static toDetail(assignment: HomeroomTeacherWithRelations) {
    return {
      ...this.toResponse(assignment),
    };
  }
}