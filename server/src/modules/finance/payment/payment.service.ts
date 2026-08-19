// src/modules/finance/payment/payment.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { PaymentMapper } from "./payment.mapper";
import { CreatePaymentDto } from "./payment.validation";
import { ReferenceNumberGenerator } from "../../../shared/utils/reference-number.generator";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class PaymentService {
  async getPayments(params: {
    invoiceId?: string; enrollmentId?: string; classroomId?: string;
    academicYearId?: string; paymentMethod?: string; startDate?: string; endDate?: string;
    search?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `payments:list:${page}:${limit}:${params.invoiceId || 'all'}:${params.classroomId || 'all'}:${params.academicYearId || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.invoiceId && { invoiceId: params.invoiceId }),
        ...(params.paymentMethod && { paymentMethod: params.paymentMethod }),
        ...(params.enrollmentId && { invoice: { enrollmentId: params.enrollmentId } }),
        ...(params.classroomId && { invoice: { enrollment: { classroomId: params.classroomId } } }),
        ...(params.academicYearId && { invoice: { feeStructure: { academicYearId: params.academicYearId } } }),
        ...(params.startDate && params.endDate && { paymentDate: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }),
        ...(params.search && { OR: [{ receiptNumber: { contains: params.search, mode: "insensitive" as const } }, { referenceNumber: { contains: params.search, mode: "insensitive" as const } }, { invoice: { enrollment: { student: { fullName: { contains: params.search, mode: "insensitive" as const } } } } }] }),
      };

      const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where, skip, take: limit,
          include: {
            invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true, enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } }, feeStructure: { select: { feeCategory: { select: { id: true, name: true } } } } } },
            receivedBy: { select: { id: true, username: true } },
          },
          orderBy: { paymentDate: "desc" },
        }),
        prisma.payment.count({ where }),
      ]);

      const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      return { items: PaymentMapper.toList(payments), summary: { totalPayments: total, totalAmount }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 60);
  }

  async getPaymentById(id: string) {
    return CacheUtils.getOrSet(`payment:${id}`, async () => {
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: { select: { id: true, invoiceNumber: true, amount: true, discount: true, taxAmount: true, totalAmount: true, status: true, enrollment: { select: { id: true, student: { select: { id: true, fullName: true, registrationNumber: true, phone: true } }, classroom: { select: { id: true, name: true } } } }, feeStructure: { select: { feeCategory: { select: { id: true, name: true } }, academicYear: { select: { id: true, name: true } } } } } },
          receivedBy: { select: { id: true, username: true } },
        },
      });
      if (!payment) throw new AppError("Payment not found.", 404);
      return PaymentMapper.toResponse(payment);
    }, 120);
  }

  async getPaymentsByInvoice(invoiceId: string) {
    const cacheKey = `payments:invoice:${invoiceId}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const invoice = await prisma.studentInvoice.findUnique({ where: { id: invoiceId }, select: { id: true, invoiceNumber: true, amount: true, totalAmount: true, status: true } });
      if (!invoice) throw new AppError("Invoice not found.", 404);

      const payments = await prisma.payment.findMany({ where: { invoiceId }, include: { receivedBy: { select: { id: true, username: true } } }, orderBy: { paymentDate: "desc" } });
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const totalAmount = Number(invoice.totalAmount || invoice.amount);

      return { invoice: { id: invoice.id, invoiceNumber: invoice.invoiceNumber, totalAmount, status: invoice.status }, payments: PaymentMapper.toList(payments), summary: { totalPayments: payments.length, totalPaid, balance: totalAmount - totalPaid, isFullyPaid: totalPaid >= totalAmount } };
    }, 60);
  }

  async createPayment(data: CreatePaymentDto, userId?: string) {
    const invoice = await prisma.studentInvoice.findUnique({ where: { id: data.invoiceId }, include: { payments: { select: { amount: true } }, enrollment: { select: { classroom: { select: { branch: { select: { code: true } } } } } } } });
    if (!invoice) throw new AppError("Invoice not found.", 404);
    if (invoice.status === "PAID") throw new AppError("Invoice is already fully paid.", 400);
    if (invoice.status === "CANCELLED") throw new AppError("Cannot pay a cancelled invoice.", 400);

    const currentTotalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const newTotalPaid = currentTotalPaid + data.amount;
    const totalAmount = Number(invoice.totalAmount || invoice.amount);
    if (newTotalPaid > totalAmount) throw new AppError(`Payment amount exceeds remaining balance. Remaining: ${totalAmount - currentTotalPaid}`, 400);

    const branchCode = invoice.enrollment?.classroom?.branch?.code || "SCH";
    const receiptNumber = await ReferenceNumberGenerator.generateReceiptNumber(prisma, branchCode);

    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: { receiptNumber, invoiceId: data.invoiceId, amount: data.amount, paymentMethod: data.paymentMethod as any, referenceNumber: data.referenceNumber, paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(), notes: data.notes, receivedByUserId: userId },
        include: { invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true, enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } }, feeStructure: { select: { feeCategory: { select: { id: true, name: true } } } } } }, receivedBy: { select: { id: true, username: true } } },
      }),
      prisma.studentInvoice.update({ where: { id: data.invoiceId }, data: { status: newTotalPaid >= totalAmount ? "PAID" : "PARTIALLY_PAID", ...(newTotalPaid >= totalAmount ? { paidAt: new Date() } : {}) } }),
    ]);

    // Invalidate all related caches
    await Promise.all([
      CacheUtils.invalidatePattern('payments:*'),
      CacheUtils.delete(`invoice:${data.invoiceId}`),
      CacheUtils.invalidatePattern('invoices:*'),
      CacheUtils.invalidatePattern('dashboard:*'),
    ]);

    return PaymentMapper.toResponse(payment);
  }

  async getMyPayments(userId: string, params?: { academicYearId?: string }) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const cacheKey = `payments:my:${studentProfile.id}:${params?.academicYearId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const enrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: studentProfile.id, isActive: true }, orderBy: { createdAt: "desc" } });
      if (!enrollment) throw new AppError("No active enrollment found.", 404);

      const where: any = { invoice: { enrollmentId: enrollment.id } };
      if (params?.academicYearId) where.invoice.feeStructure = { academicYearId: params.academicYearId };

      const payments = await prisma.payment.findMany({
        where, include: { invoice: { select: { id: true, invoiceNumber: true, totalAmount: true, status: true, feeStructure: { select: { feeCategory: { select: { id: true, name: true } } } } } } }, orderBy: { paymentDate: "desc" },
      });

      return { student: { id: studentProfile.id, fullName: studentProfile.fullName }, payments: PaymentMapper.toList(payments), summary: { totalPayments: payments.length, totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0) } };
    }, 60);
  }
}

export const paymentService = new PaymentService();