// src/modules/finance/salary/salary-structure/salary-structure.mapper.ts

type SalaryStructureWithRelations = {
  id: string;
  profileId: string;
  branchId: string;
  basicSalary: any;
  currency: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  profile?: {
    id: string;
    fullName: string;
    employeeNumber: string | null;
    phone: string | null;
  };
  branch?: {
    id: string;
    name: string;
  };
  salaryComponents?: {
    id: string;
    type: string;
    name: string;
    amount: any;
    isPercentage: boolean;
  }[];
  _count?: {
    salaryPayments: number;
  };
};

export class SalaryStructureMapper {
  static toResponse(structure: SalaryStructureWithRelations) {
    const components = structure.salaryComponents || [];
    const additions = components.filter(c => c.type !== "DEDUCTION" && c.type !== "TAX" && c.type !== "PENSION");
    const deductions = components.filter(c => c.type === "DEDUCTION" || c.type === "TAX" || c.type === "PENSION");
    
    const totalAdditions = additions.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalDeductions = deductions.reduce((sum, c) => sum + Math.abs(Number(c.amount)), 0);
    const netSalary = Number(structure.basicSalary) + totalAdditions - totalDeductions;

    return {
      id: structure.id,
      profileId: structure.profileId,
      branchId: structure.branchId,
      basicSalary: Number(structure.basicSalary),
      currency: structure.currency,
      isActive: structure.isActive,
      effectiveFrom: structure.effectiveFrom,
      effectiveTo: structure.effectiveTo,
      createdAt: structure.createdAt,
      staff: structure.profile ? {
        id: structure.profile.id,
        fullName: structure.profile.fullName,
        employeeNumber: structure.profile.employeeNumber,
        phone: structure.profile.phone,
      } : undefined,
      branch: structure.branch ? {
        id: structure.branch.id,
        name: structure.branch.name,
      } : undefined,
      components,
      salarySummary: {
        basicSalary: Number(structure.basicSalary),
        totalAdditions,
        totalDeductions,
        netSalary,
      },
      stats: {
        salaryPayments: structure._count?.salaryPayments || 0,
      },
    };
  }

  static toList(structures: SalaryStructureWithRelations[]) {
    return structures.map(s => this.toResponse(s));
  }
}