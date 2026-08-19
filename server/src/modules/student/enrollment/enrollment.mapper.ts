// src/modules/student/enrollment/enrollment.mapper.ts
type EnrollmentWithRelations = {
  id: string;
  studentId: string;
  classroomId: string;
  academicTermId: string;
  enrollmentDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    fullName: string;
    registrationNumber: string | null;
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
    assessmentResults: number;
    attendanceRecords: number;
    studentInvoices: number;
  };
};

export class EnrollmentMapper {
  static toResponse(enrollment: EnrollmentWithRelations) {
    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      classroomId: enrollment.classroomId,
      academicTermId: enrollment.academicTermId,
      enrollmentDate: enrollment.enrollmentDate,
      isActive: enrollment.isActive,
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
      student: enrollment.student ? {
        id: enrollment.student.id,
        fullName: enrollment.student.fullName,
        registrationNumber: enrollment.student.registrationNumber,
        phone: enrollment.student.phone,
        email: enrollment.student.email,
        photoUrl: enrollment.student.photoUrl,
      } : undefined,
      classroom: enrollment.classroom ? {
        id: enrollment.classroom.id,
        name: enrollment.classroom.name,
        capacity: enrollment.classroom.capacity,
        branchName: enrollment.classroom.branch?.name,
      } : undefined,
      academicTerm: enrollment.academicTerm ? {
        id: enrollment.academicTerm.id,
        name: enrollment.academicTerm.name,
        type: enrollment.academicTerm.type,
        academicYear: enrollment.academicTerm.academicYear?.name,
      } : undefined,
      stats: {
        assessmentResults: enrollment._count?.assessmentResults || 0,
        attendanceRecords: enrollment._count?.attendanceRecords || 0,
        studentInvoices: enrollment._count?.studentInvoices || 0,
      },
    };
  }

  static toList(enrollments: EnrollmentWithRelations[]) {
    return enrollments.map((enrollment) => this.toResponse(enrollment));
  }
}