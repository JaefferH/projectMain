// src/modules/academic/subject/subject.mapper.ts
type SubjectWithRelations = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  branchId: string | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  branch?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    teacherAssignments: number;
  };
};

export class SubjectMapper {
  static toResponse(subject: SubjectWithRelations) {
    return {
      id: subject.id,
      organizationId: subject.organizationId,
      code: subject.code,
      name: subject.name,
      description: subject.description,
      isActive: subject.isActive,
      branchId: subject.branchId,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      organization: subject.organization ? {
        id: subject.organization.id,
        name: subject.organization.name,
        code: subject.organization.code,
      } : undefined,
      branch: subject.branch ? {
        id: subject.branch.id,
        name: subject.branch.name,
        code: subject.branch.code,
      } : null,
      stats: {
        teacherAssignments: subject._count?.teacherAssignments || 0,
      },
    };
  }

  static toList(subjects: SubjectWithRelations[]) {
    return subjects.map((subject) => this.toResponse(subject));
  }
}