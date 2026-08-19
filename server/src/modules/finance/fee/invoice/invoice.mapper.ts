// src/modules/finance/fee/invoice/invoice.mapper.ts

type StudentInvoiceWithRelations = {
  id: string;
  invoiceNumber: string;
  enrollmentId: string;
  feeStructureId: string;
  amount: any;
  discount: any;
  discountReason: string | null;
  taxAmount: any;
  totalAmount: any;
  status: string;
  issuedAt: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  enrollment?: {
    id: string;
    student?: {
      id: string;
      fullName: string;
      registrationNumber: string | null;
    };
    classroom?: {
      id: string;
      name: string;
    };
  };
  feeStructure?: {
    id: string;
    amount: any;
    feeCategory?: {
      id: string;
      name: string;
    };
    academicYear?: {
      id: string;
      name: string;
    };
  };
  payments?: {
    id: string;
    receiptNumber: string;
    amount: any;
    paymentMethod: string;
    paymentDate: Date;
  }[];
  _count?: {
    payments: number;
  };
};

export class InvoiceMapper {
  static toResponse(invoice: StudentInvoiceWithRelations) {
    const totalAmount = Number(invoice.totalAmount) || 
      Number(invoice.amount) - Number(invoice.discount) + Number(invoice.taxAmount || 0);
    
    const totalPaid = invoice.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const balance = totalAmount - totalPaid;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      enrollmentId: invoice.enrollmentId,
      feeStructureId: invoice.feeStructureId,
      amount: Number(invoice.amount),
      discount: Number(invoice.discount),
      discountReason: invoice.discountReason,
      taxAmount: Number(invoice.taxAmount || 0),
      totalAmount,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      dueDate: invoice.dueDate,
      paidAt: invoice.paidAt,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      student: invoice.enrollment?.student ? {
        id: invoice.enrollment.student.id,
        fullName: invoice.enrollment.student.fullName,
        registrationNumber: invoice.enrollment.student.registrationNumber,
      } : undefined,
      classroom: invoice.enrollment?.classroom ? {
        id: invoice.enrollment.classroom.id,
        name: invoice.enrollment.classroom.name,
      } : undefined,
      feeCategory: invoice.feeStructure?.feeCategory ? {
        id: invoice.feeStructure.feeCategory.id,
        name: invoice.feeStructure.feeCategory.name,
      } : undefined,
      academicYear: invoice.feeStructure?.academicYear ? {
        id: invoice.feeStructure.academicYear.id,
        name: invoice.feeStructure.academicYear.name,
      } : undefined,
      payments: invoice.payments?.map(p => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        amount: Number(p.amount),
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
      })),
      paymentSummary: {
        totalPaid,
        balance,
        isFullyPaid: balance <= 0,
        paymentCount: invoice._count?.payments || invoice.payments?.length || 0,
      },
    };
  }

  static toList(invoices: StudentInvoiceWithRelations[]) {
    return invoices.map(i => this.toResponse(i));
  }
}