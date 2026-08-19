// src/modules/finance/payment/payment.mapper.ts

type PaymentWithRelations = {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  amount: any;
  paymentMethod: string;
  referenceNumber: string | null;
  paymentDate: Date;
  notes: string | null;
  receivedByUserId: string | null;
  createdAt: Date;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: any;
    status: string;
    enrollment?: {
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
      feeCategory?: {
        id: string;
        name: string;
      };
    };
  };
  receivedBy?: {
    id: string;
    username: string;
  };
};

export class PaymentMapper {
  static toResponse(payment: PaymentWithRelations) {
    return {
      id: payment.id,
      receiptNumber: payment.receiptNumber,
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      paymentDate: payment.paymentDate,
      notes: payment.notes,
      receivedBy: payment.receivedBy ? {
        id: payment.receivedBy.id,
        username: payment.receivedBy.username,
      } : undefined,
      createdAt: payment.createdAt,
      invoice: payment.invoice ? {
        id: payment.invoice.id,
        invoiceNumber: payment.invoice.invoiceNumber,
        totalAmount: Number(payment.invoice.totalAmount),
        status: payment.invoice.status,
        student: payment.invoice.enrollment?.student,
        classroom: payment.invoice.enrollment?.classroom,
        feeCategory: payment.invoice.feeStructure?.feeCategory,
      } : undefined,
    };
  }

  static toList(payments: PaymentWithRelations[]) {
    return payments.map(p => this.toResponse(p));
  }
}