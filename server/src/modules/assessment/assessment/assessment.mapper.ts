// src/modules/assessment/assessment/assessment.mapper.ts
type AssessmentWithRelations = {
  id: string;
  teacherAssignmentId: string;
  classroomId: string;
  academicTermId: string;
  title: string;
  type: string;
  totalMarks: any;
  weight: any;
  assessmentDate: Date;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  teacherAssignment?: {
    subject?: { id: string; name: string; code: string };
    teacher?: { id: string; fullName: string; employeeNumber: string | null };
  };
  classroom?: { id: string; name: string };
  academicTerm?: { id: string; name: string; academicYear?: { id: string; name: string } };
  results?: any[];
  _count?: { results: number };
};

export class AssessmentMapper {
  static toResponse(assessment: AssessmentWithRelations) {
    return {
      id: assessment.id,
      teacherAssignmentId: assessment.teacherAssignmentId,
      classroomId: assessment.classroomId,
      academicTermId: assessment.academicTermId,
      title: assessment.title,
      type: assessment.type,
      totalMarks: Number(assessment.totalMarks),
      weight: Number(assessment.weight),
      assessmentDate: assessment.assessmentDate,
      isPublished: assessment.isPublished,
      publishedAt: assessment.publishedAt,
      createdAt: assessment.createdAt,
      subject: assessment.teacherAssignment?.subject ? {
        id: assessment.teacherAssignment.subject.id,
        name: assessment.teacherAssignment.subject.name,
        code: assessment.teacherAssignment.subject.code,
      } : undefined,
      teacher: assessment.teacherAssignment?.teacher ? {
        id: assessment.teacherAssignment.teacher.id,
        fullName: assessment.teacherAssignment.teacher.fullName,
        employeeNumber: assessment.teacherAssignment.teacher.employeeNumber,
      } : undefined,
      classroom: assessment.classroom ? { id: assessment.classroom.id, name: assessment.classroom.name } : undefined,
      academicTerm: assessment.academicTerm ? {
        id: assessment.academicTerm.id,
        name: assessment.academicTerm.name,
        academicYear: assessment.academicTerm.academicYear?.name,
      } : undefined,
      stats: {
        results: assessment._count?.results || assessment.results?.length || 0,
      },
    };
  }

  static toResultResponse(result: any) {
    return {
      id: result.id,
      assessmentId: result.assessmentId,
      enrollmentId: result.enrollmentId,
      marksObtained: Number(result.marksObtained),
      percentage: result.percentage ? Number(result.percentage) : null,
      remarks: result.remarks,
      student: result.enrollment?.student ? {
        id: result.enrollment.student.id,
        fullName: result.enrollment.student.fullName,
        registrationNumber: result.enrollment.student.registrationNumber,
        photoUrl: result.enrollment.student.photoUrl,
      } : undefined,
    };
  }

  static toList(assessments: AssessmentWithRelations[]) {
    return assessments.map(a => this.toResponse(a));
  }

  static toResultList(results: any[]) {
    return results.map(r => this.toResultResponse(r));
  }
}