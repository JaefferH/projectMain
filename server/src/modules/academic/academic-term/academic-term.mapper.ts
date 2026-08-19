// src/modules/academic/academic-term/academic-term.mapper.ts
type AcademicTermWithRelations = {
  id: string;
  academicYearId: string;
  name: string;
  type: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
  academicYear?: {
    id: string;
    name: string;
    branch?: {
      id: string;
      name: string;
    };
  };
  _count?: {
    studentEnrollments: number;
    teacherAssignments: number;
  };
};

export class AcademicTermMapper {
  static toResponse(term: AcademicTermWithRelations) {
    return {
      id: term.id,
      academicYearId: term.academicYearId,
      name: term.name,
      type: term.type,
      startDate: term.startDate,
      endDate: term.endDate,
      isCurrent: term.isCurrent,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
      academicYear: term.academicYear ? {
        id: term.academicYear.id,
        name: term.academicYear.name,
        branchName: term.academicYear.branch?.name,
      } : undefined,
      stats: {
        studentEnrollments: term._count?.studentEnrollments || 0,
        teacherAssignments: term._count?.teacherAssignments || 0,
      },
    };
  }

  static toList(terms: AcademicTermWithRelations[]) {
    return terms.map((term) => this.toResponse(term));
  }
}