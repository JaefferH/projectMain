// src/modules/finance/salary/salary-payment/salary-payment.mapper.ts

type SalaryPaymentWithRelations = {
  id: string;
  salaryStructureId: string;
  profileId: string;
  branchId: string;
  paymentPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  basicSalary: any;
  totalAdditions: any;
  totalDeductions: any;
  netSalary: any;
  status: string;
  paymentMethod: string | null;
  referenceNumber: string | null;
  paymentDate: Date | null;
  processedByUserId: string | null;
  notes: string | null;
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
  salaryStructure?: {
    id: string;
    basicSalary: any;
    currency: string;
    salaryComponents?: {
      id: string;
      type: string;
      name: string;
      amount: any;
      isPercentage: boolean;
    }[];
  };
  processedBy?: {
    id: string;
    username: string;
  };
  salaryDetails?: {
    id: string;
    componentName: string;
    componentType: string;
    amount: any;
  }[];
};

export class SalaryPaymentMapper {
  static toResponse(payment: SalaryPaymentWithRelations) {
    return {
      id: payment.id,
      salaryStructureId: payment.salaryStructureId,
      profileId: payment.profileId,
      branchId: payment.branchId,
      paymentPeriod: payment.paymentPeriod,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      basicSalary: Number(payment.basicSalary),
      totalAdditions: Number(payment.totalAdditions),
      totalDeductions: Number(payment.totalDeductions),
      netSalary: Number(payment.netSalary),
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      createdAt: payment.createdAt,
      staff: payment.profile ? {
        id: payment.profile.id,
        fullName: payment.profile.fullName,
        employeeNumber: payment.profile.employeeNumber,
        phone: payment.profile.phone,
      } : undefined,
      branch: payment.branch ? {
        id: payment.branch.id,
        name: payment.branch.name,
      } : undefined,
      processedBy: payment.processedBy ? {
        id: payment.processedBy.id,
        username: payment.processedBy.username,
      } : undefined,
      details: payment.salaryDetails?.map(d => ({
        id: d.id,
        componentName: d.componentName,
        componentType: d.componentType,
        amount: Number(d.amount),
      })) || [],
      salaryStructure: payment.salaryStructure ? {
        id: payment.salaryStructure.id,
        basicSalary: Number(payment.salaryStructure.basicSalary),
        currency: payment.salaryStructure.currency,
        components: payment.salaryStructure.salaryComponents?.map(c => ({
          id: c.id,
          type: c.type,
          name: c.name,
          amount: Number(c.amount),
          isPercentage: c.isPercentage,
        })),
      } : undefined,
    };
  }

  static toList(payments: SalaryPaymentWithRelations[]) {
    return payments.map(p => this.toResponse(p));
  }
}