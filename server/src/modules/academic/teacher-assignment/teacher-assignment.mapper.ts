// src/modules/academic/teacher-assignment/teacher-assignment.mapper.ts
type TeacherAssignmentWithRelations = {
  id: string;
  teacherId: string;
  subjectId: string;
  classroomId: string;
  academicTermId: string;
  weeklyPeriods: number | null;
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
  subject?: {
    id: string;
    name: string;
    code: string;
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
  academicTerm?: {
    id: string;
    name: string;
    type: string;
    academicYear?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    assessments: number;
    timetableEntries: number;
  };
};

export class TeacherAssignmentMapper {
  static toResponse(assignment: TeacherAssignmentWithRelations) {
    return {
      id: assignment.id,
      teacherId: assignment.teacherId,
      subjectId: assignment.subjectId,
      classroomId: assignment.classroomId,
      academicTermId: assignment.academicTermId,
      weeklyPeriods: assignment.weeklyPeriods,
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
      subject: assignment.subject ? {
        id: assignment.subject.id,
        name: assignment.subject.name,
        code: assignment.subject.code,
      } : undefined,
      classroom: assignment.classroom ? {
        id: assignment.classroom.id,
        name: assignment.classroom.name,
        capacity: assignment.classroom.capacity,
        branchName: assignment.classroom.branch?.name,
      } : undefined,
      academicTerm: assignment.academicTerm ? {
        id: assignment.academicTerm.id,
        name: assignment.academicTerm.name,
        type: assignment.academicTerm.type,
        academicYear: assignment.academicTerm.academicYear?.name,
      } : undefined,
      stats: {
        assessments: assignment._count?.assessments || 0,
        timetableEntries: assignment._count?.timetableEntries || 0,
      },
    };
  }

  static toList(assignments: TeacherAssignmentWithRelations[]) {
    return assignments.map((assignment) => this.toResponse(assignment));
  }

  static toDetail(assignment: TeacherAssignmentWithRelations) {
    return {
      ...this.toResponse(assignment),
      // Add any additional detail fields if needed
    };
  }
}