// src/modules/finance/fee/fee-structure/fee-structure.mapper.ts

type FeeStructureWithRelations = {
  id: string;
  academicYearId: string;
  feeCategoryId: string;
  amount: any;
  dueDate: Date | null;
  isOptional: boolean;
  isRecurring: boolean;
  recurringInterval: string | null;
  createdAt: Date;
  updatedAt: Date;
  academicYear?: {
    id: string;
    name: string;
    isCurrent: boolean;
  };
  feeCategory?: {
    id: string;
    name: string;
    branch?: {
      id: string;
      name: string;
    };
  };
  invoices?: any[];
  _count?: {
    invoices: number;
  };
};

export class FeeStructureMapper {
  static toResponse(structure: FeeStructureWithRelations) {
    return {
      id: structure.id,
      academicYearId: structure.academicYearId,
      feeCategoryId: structure.feeCategoryId,
      amount: Number(structure.amount),
      dueDate: structure.dueDate,
      isOptional: structure.isOptional,
      isRecurring: structure.isRecurring,
      recurringInterval: structure.recurringInterval,
      createdAt: structure.createdAt,
      updatedAt: structure.updatedAt,
      academicYear: structure.academicYear ? {
        id: structure.academicYear.id,
        name: structure.academicYear.name,
        isCurrent: structure.academicYear.isCurrent,
      } : undefined,
      feeCategory: structure.feeCategory ? {
        id: structure.feeCategory.id,
        name: structure.feeCategory.name,
        branchName: structure.feeCategory.branch?.name,
      } : undefined,
      stats: {
        invoices: structure._count?.invoices || structure.invoices?.length || 0,
      },
    };
  }

  static toList(structures: FeeStructureWithRelations[]) {
    return structures.map(s => this.toResponse(s));
  }
}