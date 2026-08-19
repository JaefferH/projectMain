// src/modules/finance/salary/salary-payment/salary-payment.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../../shared/errors/AppError";
import { SalaryPaymentMapper } from "./salary-payment.mapper";
import { GenerateSalaryPaymentDto, ProcessSalaryPaymentDto, BulkGenerateSalaryDto } from "./salary-payment.validation";
import { CacheUtils } from "../../../../shared/utils/cache.utils";

class SalaryPaymentService {
  async getSalaryPayments(params: {
    branchId?: string; profileId?: string; paymentPeriod?: string;
    status?: string; startDate?: string; endDate?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 20;
    const cacheKey = `salaryPayments:list:${page}:${limit}:${params.branchId || 'all'}:${params.profileId || 'all'}:${params.paymentPeriod || 'all'}:${params.status || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.profileId && { profileId: params.profileId }),
        ...(params.paymentPeriod && { paymentPeriod: params.paymentPeriod }),
        ...(params.status && { status: params.status }),
        ...(params.startDate && params.endDate && { createdAt: { gte: new Date(params.startDate), lte: new Date(params.endDate) } }),
      };

      const [payments, total] = await prisma.$transaction([
        prisma.salaryPayment.findMany({
          where, skip, take: limit,
          include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } }, processedBy: { select: { id: true, username: true } }, salaryDetails: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.salaryPayment.count({ where }),
      ]);

      const totalNetSalary = payments.reduce((sum, p) => sum + Number(p.netSalary), 0);
      return { items: SalaryPaymentMapper.toList(payments), summary: { totalPayments: total, totalNetSalary }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async getSalaryPaymentById(id: string) {
    return CacheUtils.getOrSet(`salaryPayment:${id}`, async () => {
      const payment = await prisma.salaryPayment.findUnique({
        where: { id },
        include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } }, salaryStructure: { include: { salaryComponents: true } }, processedBy: { select: { id: true, username: true } }, salaryDetails: true },
      });
      if (!payment) throw new AppError("Salary payment not found.", 404);
      return SalaryPaymentMapper.toResponse(payment);
    }, 300);
  }

  async getMySalaryPayments(userId: string, params?: { paymentPeriod?: string }) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!profile) throw new AppError("Profile not found.", 404);

    const cacheKey = `salaryPayments:my:${profile.id}:${params?.paymentPeriod || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { profileId: profile.id };
      if (params?.paymentPeriod) where.paymentPeriod = params.paymentPeriod;

      const payments = await prisma.salaryPayment.findMany({ where, include: { branch: { select: { id: true, name: true } }, salaryDetails: true }, orderBy: { createdAt: "desc" } });
      const totalEarned = payments.filter(p => p.status === "PAID").reduce((sum, p) => sum + Number(p.netSalary), 0);

      return { staff: { id: profile.id, fullName: profile.fullName, employeeNumber: profile.employeeNumber }, payments: SalaryPaymentMapper.toList(payments), summary: { totalPayments: payments.length, paidPayments: payments.filter(p => p.status === "PAID").length, pendingPayments: payments.filter(p => p.status === "PENDING").length, totalEarned } };
    }, 120);
  }

  async generateSalaryPayment(data: GenerateSalaryPaymentDto, userId?: string) {
    const structure = await prisma.salaryStructure.findUnique({ where: { id: data.salaryStructureId }, include: { profile: { select: { id: true, fullName: true, employeeNumber: true } }, branch: { select: { id: true, name: true } }, salaryComponents: true } });
    if (!structure) throw new AppError("Salary structure not found.", 404);
    if (!structure.isActive) throw new AppError("Salary structure is not active.", 400);

    const existing = await prisma.salaryPayment.findFirst({ where: { profileId: structure.profileId, paymentPeriod: data.paymentPeriod } });
    if (existing) throw new AppError(`Salary payment for ${structure.profile.fullName} for period ${data.paymentPeriod} already exists.`, 409);

    const basicSalary = Number(structure.basicSalary);
    let totalAdditions = 0; let totalDeductions = 0;
    const details: { componentName: string; componentType: string; amount: number }[] = [{ componentName: "Basic Salary", componentType: "BASE_SALARY", amount: basicSalary }];

    structure.salaryComponents.forEach(comp => {
      let amount = Number(comp.amount);
      if (comp.isPercentage) amount = (basicSalary * amount) / 100;
      details.push({ componentName: comp.name, componentType: comp.type, amount });
      if (comp.type === "DEDUCTION" || comp.type === "TAX" || comp.type === "PENSION") totalDeductions += Math.abs(amount);
      else totalAdditions += amount;
    });

    const netSalary = basicSalary + totalAdditions - totalDeductions;
    const branchCode = structure.branch?.code || "SCH";
    const referenceNumber = `SAL-${branchCode}-${data.paymentPeriod}-${structure.profile.employeeNumber || structure.profileId.slice(-4)}`;

    const payment = await prisma.salaryPayment.create({
      data: { salaryStructureId: structure.id, profileId: structure.profileId, branchId: structure.branchId, paymentPeriod: data.paymentPeriod, periodStart: new Date(data.periodStart), periodEnd: new Date(data.periodEnd), basicSalary, totalAdditions, totalDeductions, netSalary, referenceNumber, status: "PENDING", processedByUserId: userId, notes: data.notes, salaryDetails: { create: details } },
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } }, processedBy: { select: { id: true, username: true } }, salaryDetails: true },
    });

    await this.invalidateSalaryPaymentCaches(structure.profileId);
    return SalaryPaymentMapper.toResponse(payment);
  }

  async bulkGenerateSalaryPayments(data: BulkGenerateSalaryDto, userId?: string) {
    const structures = await prisma.salaryStructure.findMany({ where: { branchId: data.branchId, isActive: true }, include: { profile: { select: { id: true, fullName: true, employeeNumber: true } }, salaryComponents: true } });
    if (structures.length === 0) throw new AppError("No active salary structures found in this branch.", 404);

    const results: { successful: any[]; failed: { staff: string; error: string }[] } = { successful: [], failed: [] };
    for (const structure of structures) {
      try { const payment = await this.generateSalaryPayment({ salaryStructureId: structure.id, paymentPeriod: data.paymentPeriod, periodStart: data.periodStart, periodEnd: data.periodEnd, notes: data.notes }, userId); results.successful.push(payment); }
      catch (error: any) { results.failed.push({ staff: structure.profile.fullName, error: error.message }); }
    }

    if (results.successful.length > 0) await CacheUtils.invalidatePattern('salaryPayments:*');
    return { message: `Generated ${results.successful.length} salary payments, ${results.failed.length} failed`, paymentPeriod: data.paymentPeriod, ...results };
  }

  async processSalaryPayment(id: string, data: ProcessSalaryPaymentDto, userId?: string) {
    const payment = await prisma.salaryPayment.findUnique({ where: { id } });
    if (!payment) throw new AppError("Salary payment not found.", 404);
    if (payment.status === "PAID") throw new AppError("Salary payment is already paid.", 400);
    if (payment.status === "CANCELLED") throw new AppError("Cannot process a cancelled salary payment.", 400);

    const updated = await prisma.salaryPayment.update({
      where: { id }, data: { status: "PAID", paymentMethod: data.paymentMethod as any, referenceNumber: data.referenceNumber, paymentDate: new Date(data.paymentDate), processedByUserId: userId, notes: data.notes || payment.notes },
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } }, processedBy: { select: { id: true, username: true } }, salaryDetails: true },
    });

    await this.invalidateSalaryPaymentCaches(payment.profileId, id);
    return SalaryPaymentMapper.toResponse(updated);
  }

  async cancelSalaryPayment(id: string, reason?: string) {
    const payment = await prisma.salaryPayment.findUnique({ where: { id } });
    if (!payment) throw new AppError("Salary payment not found.", 404);
    if (payment.status === "PAID") throw new AppError("Cannot cancel a paid salary payment.", 400);

    const updated = await prisma.salaryPayment.update({
      where: { id }, data: { status: "CANCELLED", notes: reason || "Payment cancelled" },
      include: { profile: { select: { id: true, fullName: true, employeeNumber: true, phone: true } }, branch: { select: { id: true, name: true } } },
    });

    await this.invalidateSalaryPaymentCaches(payment.profileId, id);
    return SalaryPaymentMapper.toResponse(updated);
  }

  private async invalidateSalaryPaymentCaches(profileId: string, paymentId?: string) {
    const keysToDelete: string[] = ['salaryPayments:list:*', `salaryPayments:my:${profileId}:*`, 'dashboard:*'];
    if (paymentId) keysToDelete.push(`salaryPayment:${paymentId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const salaryPaymentService = new SalaryPaymentService();