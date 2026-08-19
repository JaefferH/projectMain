// src/modules/student/guardian/guardian.mapper.ts
type GuardianWithRelations = {
  id: string;
  branchId: string;
  fullName: string;
  relationship: string;
  phone: string | null;
  alternativePhone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
  nationalId: string | null;
  telegramChatId: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  students?: {
    student: {
      id: string;
      fullName: string;
      registrationNumber: string | null;
      phone: string | null;
    };
    isPrimary: boolean;
  }[];
  _count?: {
    students: number;
  };
};

export class GuardianMapper {
  static toResponse(guardian: GuardianWithRelations) {
    return {
      id: guardian.id,
      branchId: guardian.branchId,
      fullName: guardian.fullName,
      relationship: guardian.relationship,
      phone: guardian.phone,
      alternativePhone: guardian.alternativePhone,
      email: guardian.email,
      occupation: guardian.occupation,
      address: guardian.address,
      nationalId: guardian.nationalId,
      telegramChatId: guardian.telegramChatId,
      createdAt: guardian.createdAt,
      updatedAt: guardian.updatedAt,
      branch: guardian.branch ? {
        id: guardian.branch.id,
        name: guardian.branch.name,
        code: guardian.branch.code,
      } : undefined,
      stats: {
        students: guardian._count?.students || guardian.students?.length || 0,
      },
    };
  }

  static toList(guardians: GuardianWithRelations[]) {
    return guardians.map((guardian) => this.toResponse(guardian));
  }

  static toDetail(guardian: GuardianWithRelations) {
    return {
      ...this.toResponse(guardian),
      students: guardian.students?.map((sg) => ({
        id: sg.student.id,
        fullName: sg.student.fullName,
        registrationNumber: sg.student.registrationNumber,
        phone: sg.student.phone,
        isPrimary: sg.isPrimary,
      })) || [],
    };
  }
}