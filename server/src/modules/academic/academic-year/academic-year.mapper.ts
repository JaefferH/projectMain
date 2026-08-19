// src/modules/academic/academic-year/academic-year.mapper.ts
type AcademicYearWithRelations = {
  id: string;
  branchId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    terms: number;
    classrooms: number;
    feeStructures: number;
  };
  terms?: any[];
  classrooms?: any[];
};

export class AcademicYearMapper {
  static toResponse(year: AcademicYearWithRelations) {
    return {
      id: year.id,
      branchId: year.branchId,
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      isCurrent: year.isCurrent,
      createdAt: year.createdAt,
      updatedAt: year.updatedAt,
      branch: year.branch ? {
        id: year.branch.id,
        name: year.branch.name,
        code: year.branch.code,
      } : undefined,
      stats: {
        terms: year._count?.terms || year.terms?.length || 0,
        classrooms: year._count?.classrooms || year.classrooms?.length || 0,
        feeStructures: year._count?.feeStructures || 0,
      },
    };
  }

  static toList(years: AcademicYearWithRelations[]) {
    return years.map((year) => this.toResponse(year));
  }

  static toDetail(year: AcademicYearWithRelations) {
    return {
      ...this.toResponse(year),
      terms: year.terms?.map((term: any) => ({
        id: term.id,
        name: term.name,
        type: term.type,
        startDate: term.startDate,
        endDate: term.endDate,
        isCurrent: term.isCurrent,
      })) || [],
    };
  }
}