// src/shared/utils/reference-number.generator.ts

export class ReferenceNumberGenerator {
  /**
   * Generate invoice number: INV-{branchCode}-{year}-{sequential}
   */
  static async generateInvoiceNumber(prisma: any, branchCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${branchCode}-${year}`;
    
    const lastInvoice = await prisma.studentInvoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
      select: { invoiceNumber: true },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate receipt number: RCP-{branchCode}-{year}-{sequential}
   */
  static async generateReceiptNumber(prisma: any, branchCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `RCP-${branchCode}-${year}`;
    
    const lastReceipt = await prisma.payment.findFirst({
      where: { receiptNumber: { startsWith: prefix } },
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });

    let sequence = 1;
    if (lastReceipt) {
      const lastSequence = parseInt(lastReceipt.receiptNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate voucher number: VCH-{branchCode}-{year}-{sequential}
   */
  static async generateVoucherNumber(prisma: any, branchCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VCH-${branchCode}-${year}`;
    
    const lastVoucher = await prisma.expense.findFirst({
      where: { voucherNumber: { startsWith: prefix } },
      orderBy: { voucherNumber: "desc" },
      select: { voucherNumber: true },
    });

    let sequence = 1;
    if (lastVoucher) {
      const lastSequence = parseInt(lastVoucher.voucherNumber.split('-').pop() || '0');
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Generate salary payment reference: SAL-{branchCode}-{period}
   */
  static generateSalaryReference(branchCode: string, paymentPeriod: string): string {
    return `SAL-${branchCode}-${paymentPeriod}`;
  }
}