// src/modules/finance/fee/invoice/invoice.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../../shared/errors/AppError";
import { InvoiceMapper } from "./invoice.mapper";
import { GenerateInvoicesDto, UpdateInvoiceDto, ApplyDiscountDto } from "./invoice.validation";
import { ReferenceNumberGenerator } from "../../../../shared/utils/reference-number.generator";
import { CacheUtils } from "../../../../shared/utils/cache.utils";

class InvoiceService {
  async getInvoices(params: {
    enrollmentId?: string; classroomId?: string; academicYearId?: string;
    status?: string; search?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `invoices:list:${page}:${limit}:${params.enrollmentId || 'all'}:${params.classroomId || 'all'}:${params.academicYearId || 'all'}:${params.status || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.enrollmentId && { enrollmentId: params.enrollmentId }),
        ...(params.status && { status: params.status }),
        ...(params.classroomId && { enrollment: { classroomId: params.classroomId } }),
        ...(params.academicYearId && { feeStructure: { academicYearId: params.academicYearId } }),
        ...(params.search && { OR: [{ invoiceNumber: { contains: params.search, mode: "insensitive" as const } }, { enrollment: { student: { OR: [{ fullName: { contains: params.search, mode: "insensitive" as const } }, { registrationNumber: { contains: params.search, mode: "insensitive" as const } }] } } }] }),
      };

      const [invoices, total] = await prisma.$transaction([
        prisma.studentInvoice.findMany({
          where, skip, take: limit,
          include: {
            enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } },
            feeStructure: { select: { feeCategory: { select: { id: true, name: true } }, academicYear: { select: { id: true, name: true } } } },
            payments: { select: { id: true, receiptNumber: true, amount: true, paymentMethod: true, paymentDate: true } },
            _count: { select: { payments: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.studentInvoice.count({ where }),
      ]);

      const items = invoices.map(invoice => {
        const totalAmount = Number(invoice.totalAmount) || Number(invoice.amount) - Number(invoice.discount) + Number(invoice.taxAmount || 0);
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        if (totalPaid >= totalAmount && invoice.status !== "PAID" && invoice.status !== "CANCELLED") {
          prisma.studentInvoice.update({ where: { id: invoice.id }, data: { status: "PAID", paidAt: new Date() } }).catch(() => {});
        }
        return invoice;
      });

      return { items: InvoiceMapper.toList(items), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 60); // 1 minute - invoices change frequently with payments
  }

  async getInvoiceById(id: string) {
    return CacheUtils.getOrSet(`invoice:${id}`, async () => {
      const invoice = await prisma.studentInvoice.findUnique({
        where: { id },
        include: {
          enrollment: { select: { id: true, student: { select: { id: true, fullName: true, registrationNumber: true, phone: true } }, classroom: { select: { id: true, name: true } }, academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } } } },
          feeStructure: { select: { id: true, amount: true, dueDate: true, isRecurring: true, recurringInterval: true, feeCategory: { select: { id: true, name: true, description: true } }, academicYear: { select: { id: true, name: true } } } },
          payments: { select: { id: true, receiptNumber: true, amount: true, paymentMethod: true, referenceNumber: true, paymentDate: true, notes: true, receivedBy: { select: { id: true, username: true } } }, orderBy: { paymentDate: "desc" } },
        },
      });
      if (!invoice) throw new AppError("Invoice not found.", 404);
      return InvoiceMapper.toResponse(invoice);
    }, 120);
  }

  async generateInvoices(data: GenerateInvoicesDto) {
    const academicYear = await prisma.academicYear.findUnique({ where: { id: data.academicYearId }, include: { branch: { select: { code: true } } } });
    if (!academicYear) throw new AppError("Academic year not found.", 404);

    const feeStructures = await prisma.feeStructure.findMany({ where: { academicYearId: data.academicYearId }, include: { feeCategory: true } });
    if (feeStructures.length === 0) throw new AppError("No fee structures found for this academic year.", 404);

    const enrollmentWhere: any = { isActive: true };
    if (data.classroomId) enrollmentWhere.classroomId = data.classroomId;
    if (data.enrollmentIds?.length) enrollmentWhere.id = { in: data.enrollmentIds };

    const enrollments = await prisma.studentEnrollment.findMany({ where: enrollmentWhere, include: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } }, academicTerm: { select: { id: true, academicYearId: true } } } });
    if (enrollments.length === 0) throw new AppError("No active enrollments found.", 404);

    const branchCode = academicYear.branch?.code || "SCH";
    const results: { successful: any[]; failed: { student: string; error: string }[] } = { successful: [], failed: [] };

    for (const enrollment of enrollments) {
      for (const feeStructure of feeStructures) {
        try {
          const existingInvoice = await prisma.studentInvoice.findFirst({ where: { enrollmentId: enrollment.id, feeStructureId: feeStructure.id, status: { not: "CANCELLED" } } });
          if (existingInvoice) continue;

          const invoiceNumber = await ReferenceNumberGenerator.generateInvoiceNumber(prisma, branchCode);
          let dueDate = data.dueDate ? new Date(data.dueDate) : feeStructure.dueDate;
          if (!dueDate && feeStructure.isRecurring) { dueDate = new Date(); dueDate.setMonth(dueDate.getMonth() + 1); dueDate.setDate(5); }

          const invoice = await prisma.studentInvoice.create({
            data: { invoiceNumber, enrollmentId: enrollment.id, feeStructureId: feeStructure.id, amount: feeStructure.amount, discount: 0, taxAmount: 0, totalAmount: Number(feeStructure.amount), dueDate, status: "PENDING" },
            include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } }, feeStructure: { select: { feeCategory: { select: { id: true, name: true } }, academicYear: { select: { id: true, name: true } } } } },
          });
          results.successful.push(InvoiceMapper.toResponse(invoice));
        } catch (error: any) { results.failed.push({ student: enrollment.student.fullName, error: error.message }); }
      }
    }

    // Invalidate caches
    await CacheUtils.invalidatePattern('invoices:*');
    await CacheUtils.invalidatePattern('dashboard:*');

    return { message: `Generated ${results.successful.length} invoices, ${results.failed.length} failed`, ...results };
  }

  async updateInvoice(id: string, data: UpdateInvoiceDto) {
    const invoice = await prisma.studentInvoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError("Invoice not found.", 404);
    if (invoice.status === "PAID" && data.status === "CANCELLED") throw new AppError("Cannot cancel a paid invoice.", 400);

    const updateData: any = {};
    if (data.discount !== undefined) { updateData.discount = data.discount; updateData.totalAmount = Number(invoice.amount) - data.discount + Number(invoice.taxAmount); }
    if (data.discountReason !== undefined) updateData.discountReason = data.discountReason;
    if (data.status) { updateData.status = data.status; if (data.status === "PAID") updateData.paidAt = new Date(); }
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.studentInvoice.update({
      where: { id }, data: updateData,
      include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } }, feeStructure: { select: { feeCategory: { select: { id: true, name: true } }, academicYear: { select: { id: true, name: true } } } }, payments: { select: { id: true, receiptNumber: true, amount: true, paymentMethod: true, paymentDate: true } } },
    });

    await Promise.all([CacheUtils.delete(`invoice:${id}`), CacheUtils.invalidatePattern('invoices:list:*'), CacheUtils.invalidatePattern('invoices:my:*')]);
    return InvoiceMapper.toResponse(updated);
  }

  async applyDiscount(id: string, data: ApplyDiscountDto) {
    const invoice = await prisma.studentInvoice.findUnique({ where: { id } });
    if (!invoice) throw new AppError("Invoice not found.", 404);
    if (invoice.status === "PAID") throw new AppError("Cannot discount a paid invoice.", 400);

    const updated = await prisma.studentInvoice.update({
      where: { id }, data: { discount: data.discount, discountReason: data.discountReason, totalAmount: Number(invoice.amount) - data.discount + Number(invoice.taxAmount) },
      include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } }, feeStructure: { select: { feeCategory: { select: { id: true, name: true } } } } },
    });

    await Promise.all([CacheUtils.delete(`invoice:${id}`), CacheUtils.invalidatePattern('invoices:list:*'), CacheUtils.invalidatePattern('invoices:my:*')]);
    return InvoiceMapper.toResponse(updated);
  }

  async cancelInvoice(id: string, reason?: string) {
    const invoice = await prisma.studentInvoice.findUnique({ where: { id }, include: { _count: { select: { payments: true } } } });
    if (!invoice) throw new AppError("Invoice not found.", 404);
    if (invoice.status === "PAID") throw new AppError("Cannot cancel a paid invoice.", 400);
    if (invoice._count.payments > 0) throw new AppError("Cannot cancel invoice with payments.", 400);

    const updated = await prisma.studentInvoice.update({
      where: { id }, data: { status: "CANCELLED", notes: reason || "Invoice cancelled" },
      include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true } }, classroom: { select: { id: true, name: true } } } } },
    });

    await Promise.all([CacheUtils.delete(`invoice:${id}`), CacheUtils.invalidatePattern('invoices:*')]);
    return InvoiceMapper.toResponse(updated);
  }

  async getMyInvoices(userId: string, params?: { status?: string; academicYearId?: string }) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const cacheKey = `invoices:my:${studentProfile.id}:${params?.academicYearId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const enrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: studentProfile.id, isActive: true }, orderBy: { createdAt: "desc" } });
      if (!enrollment) throw new AppError("No active enrollment found.", 404);

      const where: any = { enrollmentId: enrollment.id, ...(params?.status && { status: params.status }) };
      if (params?.academicYearId) where.feeStructure = { academicYearId: params.academicYearId };

      const invoices = await prisma.studentInvoice.findMany({
        where,
        include: { feeStructure: { select: { feeCategory: { select: { id: true, name: true } }, academicYear: { select: { id: true, name: true } } } }, payments: { select: { id: true, receiptNumber: true, amount: true, paymentMethod: true, paymentDate: true } } },
        orderBy: { createdAt: "desc" },
      });

      const totalOwed = invoices.filter(i => i.status === "PENDING" || i.status === "PARTIALLY_PAID").reduce((sum, i) => { const totalPaid = i.payments.reduce((s, p) => s + Number(p.amount), 0); return sum + (Number(i.totalAmount || i.amount) - totalPaid); }, 0);

      return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, invoices: InvoiceMapper.toList(invoices), summary: { totalInvoices: invoices.length, pendingInvoices: invoices.filter(i => i.status === "PENDING").length, paidInvoices: invoices.filter(i => i.status === "PAID").length, totalOwed } };
    }, 60);
  }
}

export const invoiceService = new InvoiceService();