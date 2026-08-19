// src/modules/academic/classroom/classroom.mapper.ts
type ClassroomWithRelations = {
  id: string;
  branchId: string;
  academicYearId: string;
  name: string;
  capacity: number | null;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  academicYear?: {
    id: string;
    name: string;
  };
  _count?: {
    studentEnrollments: number;
    teacherAssignments: number;
  };
  studentEnrollments?: {
    id: string;
    studentId: string;
    enrollmentDate: Date;
    isActive: boolean;
    student?: {
      id: string;
      fullName: string;
      registrationNumber?: string;
    };
  }[];
  teacherAssignments?: {
    id: string;
    teacherId: string;
    subjectId: string;
    weeklyPeriods: number | null;
    teacher?: {
      id: string;
      fullName: string;
      employeeNumber?: string;
    };
    subject?: {
      id: string;
      name: string;
      code: string;
    };
  }[];
};

export class ClassroomMapper {
  static toResponse(classroom: ClassroomWithRelations) {
    return {
      id: classroom.id,
      branchId: classroom.branchId,
      academicYearId: classroom.academicYearId,
      name: classroom.name,
      capacity: classroom.capacity,
      createdAt: classroom.createdAt,
      updatedAt: classroom.updatedAt,
      branch: classroom.branch ? {
        id: classroom.branch.id,
        name: classroom.branch.name,
        code: classroom.branch.code,
      } : undefined,
      academicYear: classroom.academicYear ? {
        id: classroom.academicYear.id,
        name: classroom.academicYear.name,
      } : undefined,
      stats: {
        students: classroom._count?.studentEnrollments || classroom.studentEnrollments?.length || 0,
        teachers: classroom._count?.teacherAssignments || classroom.teacherAssignments?.length || 0,
      },
    };
  }

  static toList(classrooms: ClassroomWithRelations[]) {
    return classrooms.map((classroom) => this.toResponse(classroom));
  }

  static toDetail(classroom: ClassroomWithRelations) {
    return {
      ...this.toResponse(classroom),
      students: classroom.studentEnrollments?.map((enrollment) => ({
        id: enrollment.id,
        studentId: enrollment.studentId,
        studentName: enrollment.student?.fullName,
        registrationNumber: enrollment.student?.registrationNumber,
        enrollmentDate: enrollment.enrollmentDate,
        isActive: enrollment.isActive,
      })) || [],
      teachers: classroom.teacherAssignments?.map((assignment) => ({
        id: assignment.id,
        teacherId: assignment.teacherId,
        teacherName: assignment.teacher?.fullName,
        employeeNumber: assignment.teacher?.employeeNumber,
        subjectId: assignment.subjectId,
        subjectName: assignment.subject?.name,
        subjectCode: assignment.subject?.code,
        weeklyPeriods: assignment.weeklyPeriods,
      })) || [],
      occupancy: classroom.capacity ? {
        current: classroom.studentEnrollments?.filter(e => e.isActive).length || 0,
        capacity: classroom.capacity,
        available: classroom.capacity - (classroom.studentEnrollments?.filter(e => e.isActive).length || 0),
        percentage: Math.round(
          ((classroom.studentEnrollments?.filter(e => e.isActive).length || 0) / classroom.capacity) * 100
        ),
      } : null,
    };
  }
}