
type FeeCategoryWithRelations = {
  id: string;
  branchId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  feeStructures?: any[];
  _count?: {
    feeStructures: number;
  };
};

export class FeeCategoryMapper {
  static toResponse(category: FeeCategoryWithRelations) {
    return {
      id: category.id,
      branchId: category.branchId,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      branch: category.branch ? {
        id: category.branch.id,
        name: category.branch.name,
        code: category.branch.code,
      } : undefined,
      stats: {
        feeStructures: category._count?.feeStructures || category.feeStructures?.length || 0,
      },
    };
  }

  static toList(categories: FeeCategoryWithRelations[]) {
    return categories.map(c => this.toResponse(c));
  }
}