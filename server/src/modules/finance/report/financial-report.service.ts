// src/modules/finance/report/financial-report.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { FinancialReportMapper } from "./financial-report.mapper";
import { GenerateFinancialReportDto } from "./financial-report.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class FinancialReportService {
  async getReports(params: {
    branchId?: string; academicYearId?: string; reportType?: string;
    reportPeriod?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 10;
    const cacheKey = `financialReports:list:${page}:${limit}:${params.branchId || 'all'}:${params.academicYearId || 'all'}:${params.reportType || 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.branchId && { branchId: params.branchId }),
        ...(params.academicYearId && { academicYearId: params.academicYearId }),
        ...(params.reportType && { reportType: params.reportType }),
        ...(params.reportPeriod && { reportPeriod: params.reportPeriod }),
      };

      const [reports, total] = await prisma.$transaction([
        prisma.financialReport.findMany({
          where, skip, take: limit,
          include: { branch: { select: { id: true, name: true, code: true } }, academicYear: { select: { id: true, name: true } }, generatedBy: { select: { id: true, username: true } } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.financialReport.count({ where }),
      ]);

      return { items: FinancialReportMapper.toList(reports), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 300);
  }

  async getReportById(id: string) {
    return CacheUtils.getOrSet(`financialReport:${id}`, async () => {
      const report = await prisma.financialReport.findUnique({
        where: { id },
        include: { branch: { select: { id: true, name: true, code: true } }, academicYear: { select: { id: true, name: true } }, generatedBy: { select: { id: true, username: true } } },
      });
      if (!report) throw new AppError("Financial report not found.", 404);
      return FinancialReportMapper.toResponse(report);
    }, 600);
  }

  async generateReport(data: GenerateFinancialReportDto, userId: string) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId }, select: { id: true, name: true, code: true } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    const periodStartStr = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    const periodEndStr = `${periodEnd.getFullYear()}-${String(periodEnd.getMonth() + 1).padStart(2, '0')}`;

    // Check if report already exists
    const existing = await prisma.financialReport.findUnique({
      where: { branchId_reportType_reportPeriod: { branchId: data.branchId, reportType: data.reportType, reportPeriod: data.reportPeriod } },
    });

    // Calculate all metrics
    const [revenues, expenses, payments, salaries] = await Promise.all([
      prisma.revenue.findMany({ where: { branchId: data.branchId, receivedDate: { gte: periodStart, lte: periodEnd } } }),
      prisma.expense.findMany({ where: { branchId: data.branchId, status: "APPROVED", expenseDate: { gte: periodStart, lte: periodEnd } } }),
      prisma.payment.findMany({ where: { paymentDate: { gte: periodStart, lte: periodEnd }, invoice: { enrollment: { classroom: { branchId: data.branchId } } } } }),
      prisma.salaryPayment.findMany({ where: { branchId: data.branchId, status: "PAID", paymentPeriod: { gte: periodStartStr, lte: periodEndStr } } }),
    ]);

    const totalRevenue = revenues.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalFeesCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalSalaries = salaries.reduce((sum, s) => sum + Number(s.netSalary), 0);
    const netIncome = totalRevenue + totalFeesCollected - totalExpenses - totalSalaries;

    const reportData = { branchId: data.branchId, academicYearId: data.academicYearId || null, reportType: data.reportType, reportPeriod: data.reportPeriod, periodStart, periodEnd, totalRevenue, totalExpenses, totalFeesCollected, totalSalaries, netIncome, generatedById: userId, notes: data.notes };

    let report;
    if (existing) {
      report = await prisma.financialReport.update({ where: { id: existing.id }, data: reportData, include: { branch: { select: { id: true, name: true, code: true } }, academicYear: { select: { id: true, name: true } }, generatedBy: { select: { id: true, username: true } } } });
    } else {
      report = await prisma.financialReport.create({ data: reportData, include: { branch: { select: { id: true, name: true, code: true } }, academicYear: { select: { id: true, name: true } }, generatedBy: { select: { id: true, username: true } } } });
    }

    // Build detailed breakdown
    const [revenueByCategory, expenseByCategory, feesByCategory, pendingExpenses] = await Promise.all([
      this.getRevenueByCategory(data.branchId, periodStart, periodEnd),
      this.getExpenseByCategory(data.branchId, periodStart, periodEnd),
      this.getFeesByCategory(data.branchId, periodStart, periodEnd),
      this.getPendingExpenses(data.branchId),
    ]);

    // Invalidate caches
    await CacheUtils.invalidatePattern('financialReports:list:*');
    await CacheUtils.invalidatePattern('financialOverview:*');

    return {
      report: FinancialReportMapper.toResponse(report),
      breakdown: { revenue: { total: totalRevenue, byCategory: revenueByCategory }, expenses: { total: totalExpenses, byCategory: expenseByCategory, pending: pendingExpenses }, feesCollected: { total: totalFeesCollected, byCategory: feesByCategory }, salaries: { total: totalSalaries, count: salaries.length } },
      summary: { totalIncome: totalRevenue + totalFeesCollected, totalOutflow: totalExpenses + totalSalaries, netIncome, isProfitable: netIncome > 0, profitMargin: (totalRevenue + totalFeesCollected) > 0 ? Math.round((netIncome / (totalRevenue + totalFeesCollected)) * 100) : 0 },
    };
  }

  async getFinancialOverview(params: { branchId: string; periodStart: string; periodEnd: string }) {
    const branch = await prisma.branch.findUnique({ where: { id: params.branchId } });
    if (!branch) throw new AppError("Branch not found.", 404);

    const periodStart = new Date(params.periodStart);
    const periodEnd = new Date(params.periodEnd);
    const cacheKey = `financialOverview:${params.branchId}:${params.periodStart}:${params.periodEnd}`;

    return CacheUtils.getOrSet(cacheKey, async () => {
      const [revenueResult, expenseResult, paymentResult, salaryResult, pendingExpensesResult] = await Promise.all([
        prisma.revenue.aggregate({ where: { branchId: params.branchId, receivedDate: { gte: periodStart, lte: periodEnd } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { branchId: params.branchId, status: "APPROVED", expenseDate: { gte: periodStart, lte: periodEnd } }, _sum: { amount: true } }),
        prisma.payment.aggregate({ where: { paymentDate: { gte: periodStart, lte: periodEnd }, invoice: { enrollment: { classroom: { branchId: params.branchId } } } }, _sum: { amount: true } }),
        prisma.salaryPayment.aggregate({ where: { branchId: params.branchId, status: "PAID", periodStart: { gte: periodStart }, periodEnd: { lte: periodEnd } }, _sum: { netSalary: true } }),
        prisma.expense.aggregate({ where: { branchId: params.branchId, status: "PENDING" }, _sum: { amount: true }, _count: true }),
      ]);

      const totalRevenue = Number(revenueResult._sum.amount || 0);
      const totalExpenses = Number(expenseResult._sum.amount || 0);
      const totalFees = Number(paymentResult._sum.amount || 0);
      const totalSalaries = Number(salaryResult._sum.netSalary || 0);
      const netIncome = totalRevenue + totalFees - totalExpenses - totalSalaries;

      const [pendingInvoices, activeStudents, activeStaff] = await Promise.all([
        prisma.studentInvoice.aggregate({ where: { status: { in: ["PENDING", "PARTIALLY_PAID"] }, enrollment: { classroom: { branchId: params.branchId } } }, _sum: { totalAmount: true }, _count: true }),
        prisma.studentEnrollment.count({ where: { isActive: true, classroom: { branchId: params.branchId } } }),
        prisma.salaryStructure.count({ where: { branchId: params.branchId, isActive: true } }),
      ]);

      return {
        branch: { id: branch.id, name: branch.name, code: branch.code },
        period: { start: periodStart, end: periodEnd },
        income: { revenue: totalRevenue, feesCollected: totalFees, totalIncome: totalRevenue + totalFees },
        expenses: { operational: totalExpenses, salaries: totalSalaries, totalExpenses: totalExpenses + totalSalaries },
        netIncome, isProfitable: netIncome > 0,
        receivables: { pendingInvoices: pendingInvoices._count, pendingAmount: Number(pendingInvoices._sum.totalAmount || 0) },
        payables: { pendingExpenses: pendingExpensesResult._count, pendingExpenseAmount: Number(pendingExpensesResult._sum.amount || 0) },
        stats: { activeStudents, activeStaff },
      };
    }, 120);
  }

  // Helper methods
  private async getRevenueByCategory(branchId: string, start: Date, end: Date) {
    const revenues = await prisma.revenue.findMany({ where: { branchId, receivedDate: { gte: start, lte: end } }, include: { category: { select: { id: true, name: true } } } });
    const grouped: Record<string, { categoryId: string; categoryName: string; count: number; total: number }> = {};
    revenues.forEach(r => { const key = r.categoryId; if (!grouped[key]) grouped[key] = { categoryId: key, categoryName: r.category?.name || "Unknown", count: 0, total: 0 }; grouped[key].count++; grouped[key].total += Number(r.amount); });
    return Object.values(grouped);
  }

  private async getExpenseByCategory(branchId: string, start: Date, end: Date) {
    const expenses = await prisma.expense.findMany({ where: { branchId, status: "APPROVED", expenseDate: { gte: start, lte: end } }, include: { category: { select: { id: true, name: true } } } });
    const grouped: Record<string, { categoryId: string; categoryName: string; count: number; total: number }> = {};
    expenses.forEach(e => { const key = e.categoryId; if (!grouped[key]) grouped[key] = { categoryId: key, categoryName: e.category?.name || "Unknown", count: 0, total: 0 }; grouped[key].count++; grouped[key].total += Number(e.amount); });
    return Object.values(grouped);
  }

  private async getFeesByCategory(branchId: string, start: Date, end: Date) {
    const payments = await prisma.payment.findMany({ where: { paymentDate: { gte: start, lte: end }, invoice: { enrollment: { classroom: { branchId } } } }, include: { invoice: { include: { feeStructure: { include: { feeCategory: { select: { id: true, name: true } } } } } } } });
    const grouped: Record<string, { categoryId: string; categoryName: string; count: number; total: number }> = {};
    payments.forEach(p => { const category = p.invoice?.feeStructure?.feeCategory; const key = category?.id || "unknown"; if (!grouped[key]) grouped[key] = { categoryId: key, categoryName: category?.name || "Unknown", count: 0, total: 0 }; grouped[key].count++; grouped[key].total += Number(p.amount); });
    return Object.values(grouped);
  }

  private async getPendingExpenses(branchId: string) {
    const pending = await prisma.expense.findMany({ where: { branchId, status: "PENDING" }, include: { category: { select: { id: true, name: true } } }, orderBy: { expenseDate: "desc" } });
    return { count: pending.length, totalAmount: pending.reduce((sum, e) => sum + Number(e.amount), 0), items: pending.map(e => ({ id: e.id, voucherNumber: e.voucherNumber, category: e.category?.name, amount: Number(e.amount), expenseDate: e.expenseDate, description: e.description })) };
  }
}

export const financialReportService = new FinancialReportService();