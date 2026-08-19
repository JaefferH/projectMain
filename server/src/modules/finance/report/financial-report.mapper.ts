
type FinancialReportWithRelations = {
  id: string;
  branchId: string;
  academicYearId: string | null;
  reportType: string;
  reportPeriod: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: any;
  totalExpenses: any;
  totalFeesCollected: any;
  totalSalaries: any;
  netIncome: any;
  generatedById: string;
  notes: string | null;
  createdAt: Date;
  branch?: { id: string; name: string; code: string };
  academicYear?: { id: string; name: string } | null;
  generatedBy?: { id: string; username: string };
};

export class FinancialReportMapper {
  static toResponse(report: FinancialReportWithRelations) {
    return {
      id: report.id,
      branchId: report.branchId,
      academicYearId: report.academicYearId,
      reportType: report.reportType,
      reportPeriod: report.reportPeriod,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      totalRevenue: Number(report.totalRevenue),
      totalExpenses: Number(report.totalExpenses),
      totalFeesCollected: Number(report.totalFeesCollected),
      totalSalaries: Number(report.totalSalaries),
      netIncome: Number(report.netIncome),
      notes: report.notes,
      createdAt: report.createdAt,
      branch: report.branch,
      academicYear: report.academicYear,
      generatedBy: report.generatedBy ? { id: report.generatedBy.id, username: report.generatedBy.username } : undefined,
      profitMargin: Number(report.totalRevenue) > 0 
        ? Math.round((Number(report.netIncome) / Number(report.totalRevenue)) * 100) 
        : 0,
    };
  }

  static toList(reports: FinancialReportWithRelations[]) {
    return reports.map(r => this.toResponse(r));
  }
}