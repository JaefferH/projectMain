// src/modules/dashboard/dashboard.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../shared/errors/AppError";

class DashboardService {
  /**
   * Admin Dashboard
   */
  // src/modules/dashboard/dashboard.service.ts

// src/modules/dashboard/dashboard.service.ts

async getAdminDashboard(user: any) {
  const userRoles = user.roles?.map((r: any) => r.name) || [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");

  // For SUPER_ADMIN: no filter (see everything)
  // For others: filter by branchId or organizationId
  let branchId: string | undefined;
  
  if (!isSuperAdmin) {
    if (user.branchId) {
      branchId = user.branchId;
    } else if (user.organizationId) {
      // Find branches in this organization
      const branches = await prisma.branch.findMany({
        where: { organizationId: user.organizationId },
        select: { id: true },
      });
      // We'll use the first branch or filter by organization through branch relation
    }
  }

  console.log('Dashboard for user:', { userId: user.id, isSuperAdmin, branchId, organizationId: user.organizationId });

  // Build where clauses
  const branchIdFilter = branchId ? { branchId } : {};
  const branchOrgFilter = !branchId && user.organizationId ? { branch: { organizationId: user.organizationId } } : {};

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  // Get counts - use branchId or no filter for super admin
  const [
    totalStudents,
    totalTeachers,
    totalStaff,
    totalClassrooms,
    activeAcademicYear,
    currentTerm,
    monthlyPayments,
    pendingInvoices,
    monthlyRevenue,
    monthlyExpenses,
    monthlySalaries,
    recentStudents,
    recentPayments,
    recentAnnouncements,
  ] = await Promise.all([
    // Total Students
    branchId 
      ? prisma.studentEnrollment.count({ where: { isActive: true, classroom: { branchId } } })
      : prisma.studentEnrollment.count({ where: { isActive: true } }),

    // Total Teachers (unique)
    branchId
      ? prisma.teacherAssignment.groupBy({ by: ['teacherId'], where: { classroom: { branchId } } })
      : prisma.teacherAssignment.groupBy({ by: ['teacherId'] }),

    // Total Staff (active salary structures)
    branchId
      ? prisma.salaryStructure.count({ where: { branchId, isActive: true } })
      : prisma.salaryStructure.count({ where: { isActive: true } }),

    // Total Classrooms
    branchId
      ? prisma.classroom.count({ where: { branchId } })
      : prisma.classroom.count(),

    // Current Academic Year
    branchId
      ? prisma.academicYear.findFirst({ where: { branchId, isCurrent: true }, select: { id: true, name: true } })
      : prisma.academicYear.findFirst({ where: { isCurrent: true }, select: { id: true, name: true } }),

    // Current Term
    branchId
      ? prisma.academicTerm.findFirst({ where: { isCurrent: true, academicYear: { branchId, isCurrent: true } }, select: { id: true, name: true, type: true } })
      : prisma.academicTerm.findFirst({ where: { isCurrent: true, academicYear: { isCurrent: true } }, select: { id: true, name: true, type: true } }),

    // Monthly Payments
    prisma.payment.aggregate({
      where: {
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
        ...(branchId ? { invoice: { enrollment: { classroom: { branchId } } } } : {}),
      },
      _sum: { amount: true },
    }),

    // Pending Invoices
    prisma.studentInvoice.aggregate({
      where: {
        status: { in: ["PENDING", "PARTIALLY_PAID"] },
        ...(branchId ? { enrollment: { classroom: { branchId } } } : {}),
      },
      _sum: { totalAmount: true },
      _count: true,
    }),

    // Monthly Revenue
    prisma.revenue.aggregate({
      where: {
        receivedDate: { gte: startOfMonth, lte: endOfMonth },
        ...(branchId ? { branchId } : {}),
      },
      _sum: { amount: true },
    }),

    // Monthly Expenses (approved)
    prisma.expense.aggregate({
      where: {
        status: "APPROVED",
        expenseDate: { gte: startOfMonth, lte: endOfMonth },
        ...(branchId ? { branchId } : {}),
      },
      _sum: { amount: true },
    }),

    // Monthly Salaries (paid)
    prisma.salaryPayment.aggregate({
      where: {
        status: "PAID",
        paymentDate: { gte: startOfMonth, lte: endOfMonth },
        ...(branchId ? { branchId } : {}),
      },
      _sum: { netSalary: true },
    }),

    // Recent Students
    prisma.user.findMany({
      where: {
        profile: {
          studentEnrollments: {
            some: { isActive: true, ...(branchId ? { classroom: { branchId } } : {}) },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, username: true, createdAt: true, profile: { select: { fullName: true, registrationNumber: true } } },
    }),

    // Recent Payments
    prisma.payment.findMany({
      where: {
        ...(branchId ? { invoice: { enrollment: { classroom: { branchId } } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amount: true, receiptNumber: true, paymentDate: true, invoice: { select: { enrollment: { select: { student: { select: { fullName: true } } } } } } },
    }),

    // Recent Announcements
    prisma.announcement.findMany({
      where: { isPublished: true, ...(branchId ? { branchId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, type: true, priority: true, createdAt: true },
    }),
  ]);

  // Attendance overview (last 30 days)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const attendanceRecords = await prisma.studentAttendanceRecord.findMany({
    where: {
      attendanceSession: {
        sessionDate: { gte: thirtyDaysAgo },
        ...(branchId ? { classroom: { branchId } } : {}),
      },
    },
    select: { status: true },
  });

  const attendanceSummary = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === "PRESENT").length,
    absent: attendanceRecords.filter(r => r.status === "ABSENT").length,
    late: attendanceRecords.filter(r => r.status === "LATE").length,
    rate: attendanceRecords.length > 0
      ? Math.round((attendanceRecords.filter(r => r.status === "PRESENT").length / attendanceRecords.length) * 100)
      : 0,
  };

  let branchInfo = null;

  // Try to get branch from user's branchId
  if (user.branchId) {
    branchInfo = await prisma.branch.findUnique({
      where: { id: user.branchId },
      select: { id: true, name: true, code: true },
    });
  }

  // If no branch, try from profile
  if (!branchInfo && user.profileId) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.profileId },
      select: { branch: { select: { id: true, name: true, code: true } } },
    });
    branchInfo = profile?.branch || null;
  }

  // If still no branch, try from organization
  if (!branchInfo && user.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true, code: true },
    });
    branchInfo = org;
  }

  return {
    type: "admin",
    isSuperAdmin,
    branchId: branchInfo,
    academicYear: activeAcademicYear,
    currentTerm,
    stats: {
      totalStudents,
      totalTeachers: totalTeachers.length,
      totalStaff,
      totalClassrooms,
    },
    finance: {
      monthlyFeesCollected: Number(monthlyPayments._sum.amount || 0),
      pendingFees: Number(pendingInvoices._sum.totalAmount || 0),
      pendingInvoicesCount: pendingInvoices._count,
      monthlyRevenue: Number(monthlyRevenue._sum.amount || 0),
      monthlyExpenses: Number(monthlyExpenses._sum.amount || 0),
      monthlySalaries: Number(monthlySalaries._sum.netSalary || 0),
      netIncome: Number(monthlyPayments._sum.amount || 0) + Number(monthlyRevenue._sum.amount || 0) - Number(monthlyExpenses._sum.amount || 0) - Number(monthlySalaries._sum.netSalary || 0),
    },
    attendance: attendanceSummary,
    recentActivity: {
      newStudents: recentStudents.map(s => ({
        id: s.id,
        name: s.profile?.fullName || s.username,
        registrationNumber: s.profile?.registrationNumber,
        joinedAt: s.createdAt,
      })),
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        student: p.invoice?.enrollment?.student?.fullName,
        amount: Number(p.amount),
        receiptNumber: p.receiptNumber,
        date: p.paymentDate,
      })),
      announcements: recentAnnouncements.map(a => ({
        id: a.id,
        title: a.title,
        type: a.type,
        priority: a.priority,
        createdAt: a.createdAt,
      })),
    },
  };
}

  /**
   * Teacher Dashboard
   */
  async getTeacherDashboard(user: any) {
    // Get teacher's profile
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) throw new AppError("Profile not found.", 404);

    // Get homeroom class
    const homeroom = await prisma.homeroomTeacher.findFirst({
      where: { teacherId: profile.id, isActive: true },
      include: {
        classroom: { select: { id: true, name: true } },
        academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
      },
    });

    let classInfo = null;
    if (homeroom) {
      const studentCount = await prisma.studentEnrollment.count({
        where: { classroomId: homeroom.classroomId, academicTermId: homeroom.academicTermId, isActive: true },
      });

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const todayAttendance = await prisma.studentAttendanceSession.findFirst({
        where: { classroomId: homeroom.classroomId, sessionDate: { gte: today, lt: tomorrow } },
        include: {
          records: { select: { status: true } },
        },
      });

      classInfo = {
        classroom: homeroom.classroom,
        academicTerm: homeroom.academicTerm,
        totalStudents: studentCount,
        todayAttendance: todayAttendance ? {
          taken: true,
          present: todayAttendance.records.filter(r => r.status === "PRESENT").length,
          absent: todayAttendance.records.filter(r => r.status === "ABSENT").length,
          late: todayAttendance.records.filter(r => r.status === "LATE").length,
          isLocked: todayAttendance.isLocked,
        } : { taken: false },
      };
    }

    // Today's timetable
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const today = new Date();
    const todayDayName = days[today.getDay()];

    const todayTimetable = await prisma.timetableEntry.findMany({
      where: {
        teacherAssignment: { teacherId: profile.id },
        dayOfWeek: todayDayName as any,
        isActive: true,
      },
      include: {
        schedulePeriod: { select: { name: true, shortName: true, order: true, startTime: true, endTime: true } },
        teacherAssignment: {
          select: {
            subject: { select: { id: true, name: true, code: true } },
          },
        },
        classroom: { select: { id: true, name: true } },
      },
      orderBy: { schedulePeriod: { order: "asc" } },
    });

    // Pending assessments to grade
    const pendingAssessments = await prisma.assessment.findMany({
      where: {
        teacherAssignment: { teacherId: profile.id },
        isPublished: false,
      },
      include: {
        classroom: { select: { id: true, name: true } },
        _count: { select: { results: true } },
      },
      orderBy: { assessmentDate: "desc" },
      take: 5,
    });

    // Recent announcements
    const announcements = await prisma.announcement.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, type: true, createdAt: true },
    });

    return {
      type: "teacher",
      teacher: {
        id: profile.id,
        fullName: profile.fullName,
        employeeNumber: profile.employeeNumber,
      },
      homeroomClass: classInfo,
      todaySchedule: todayTimetable.map(t => ({
        period: t.schedulePeriod,
        subject: t.teacherAssignment.subject,
        classroom: t.classroom,
      })),
      pendingAssessments: pendingAssessments.map((a: any) => ({
        id: a.id,
        title: a.title,
        type: a.type,
        classroom: a.classroom?.name,
        resultsCount: a._count.results,
        assessmentDate: a.assessmentDate,
      })),
      announcements,
    };
  }

  /**
   * Student Dashboard
   */
  async getStudentDashboard(user: any) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) throw new AppError("Profile not found.", 404);

    // Get active enrollment
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: { studentId: profile.id, isActive: true },
      include: {
        classroom: { select: { id: true, name: true } },
        academicTerm: {
          select: { id: true, name: true, type: true, academicYear: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!enrollment) {
      return {
        type: "student",
        student: { id: profile.id, fullName: profile.fullName, registrationNumber: profile.registrationNumber },
        hasEnrollment: false,
      };
    }

    // Today's timetable
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const today = new Date();
    const todayDayName = days[today.getDay()];

    const todayTimetable = await prisma.timetableEntry.findMany({
      where: {
        classroomId: enrollment.classroomId,
        dayOfWeek: todayDayName as any,
        isActive: true,
      },
      include: {
        schedulePeriod: { select: { name: true, shortName: true, order: true, startTime: true, endTime: true } },
        teacherAssignment: {
          select: {
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { schedulePeriod: { order: "asc" } },
    });

    // Recent grades
    const recentResults = await prisma.assessmentResult.findMany({
      where: { enrollmentId: enrollment.id, assessment: { isPublished: true } },
      include: {
        assessment: {
          include: { teacherAssignment: { include: { subject: { select: { id: true, name: true, code: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Fee status
    const invoices = await prisma.studentInvoice.findMany({
      where: { enrollmentId: enrollment.id },
      include: { payments: true, feeStructure: { include: { feeCategory: true } } },
    });

    let totalOwed = 0;
    invoices.forEach(inv => {
      const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      totalOwed += Number(inv.totalAmount || inv.amount) - paid;
    });

    // Attendance
    const attendanceRecords = await prisma.studentAttendanceRecord.findMany({
      where: { enrollmentId: enrollment.id },
      select: { status: true },
    });

    const attendanceSummary = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(r => r.status === "PRESENT").length,
      absent: attendanceRecords.filter(r => r.status === "ABSENT").length,
      late: attendanceRecords.filter(r => r.status === "LATE").length,
      rate: attendanceRecords.length > 0
        ? Math.round((attendanceRecords.filter(r => r.status === "PRESENT").length / attendanceRecords.length) * 100)
        : 0,
    };

    // Upcoming assessments
    const upcomingAssessments = await prisma.assessment.findMany({
      where: {
        classroomId: enrollment.classroomId,
        isPublished: false,
        assessmentDate: { gte: today },
      },
      include: {
        teacherAssignment: { include: { subject: { select: { id: true, name: true, code: true } } } },
      },
      orderBy: { assessmentDate: "asc" },
      take: 5,
    });

    return {
      type: "student",
      student: { id: profile.id, fullName: profile.fullName, registrationNumber: profile.registrationNumber },
      hasEnrollment: true,
      classroom: enrollment.classroom,
      academicTerm: enrollment.academicTerm,
      todaySchedule: todayTimetable.map(t => ({
        period: t.schedulePeriod,
        subject: t.teacherAssignment.subject,
        teacher: t.teacherAssignment.teacher.fullName,
      })),
      recentGrades: recentResults.map(r => ({
        id: r.id,
        assessment: r.assessment.title,
        subject: r.assessment.teacherAssignment.subject,
        marks: Number(r.marksObtained),
        percentage: r.percentage ? Number(r.percentage) : null,
      })),
      fees: {
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(i => i.status !== "PAID" && i.status !== "CANCELLED").length,
        totalOwed,
        status: totalOwed > 0 ? "PENDING" : "CLEAR",
      },
      attendance: attendanceSummary,
      upcomingAssessments: upcomingAssessments.map(a => ({
        id: a.id,
        title: a.title,
        subject: a.teacherAssignment.subject,
        type: a.type,
        assessmentDate: a.assessmentDate,
      })),
    };
  }

  async getCalendarEvents(user: any, params: { month?: number; year?: number }) {
  const now = new Date();
  const month = params.month ?? now.getMonth() + 1;
  const year = params.year ?? now.getFullYear();
  
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const userRoles = user.roles?.map((r: any) => r.name) || [];
  const isSuperAdmin = userRoles.includes("SUPER_ADMIN");
  const isTeacher = userRoles.includes("TEACHER");
  const isStudent = userRoles.includes("STUDENT");

  // Build audience filter
  const audienceTypes: string[] = ["ALL"];
  if (isSuperAdmin || userRoles.includes("ADMIN")) audienceTypes.push("ADMIN");
  if (isTeacher) audienceTypes.push("TEACHER");
  if (isStudent) audienceTypes.push("STUDENT");

  const where: any = {
    isPublished: true,
    // Events in this month OR ongoing announcements
    OR: [
      // Events with specific date in this month
      {
        eventDate: { gte: startDate, lte: endDate },
      },
      // Announcements active during this month
      {
        eventDate: null,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      // Announcements with no date (always visible)
      {
        eventDate: null,
        startDate: null,
        endDate: null,
      },
    ],
    // Filter by audience
    targetAudience: { hasSome: audienceTypes },
  };

  // Non-super-admin sees only their branch
  if (!isSuperAdmin && user.branchId) {
    where.branchId = user.branchId;
  }

  const events = await prisma.announcement.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      excerpt: true,
      type: true,
      priority: true,
      eventDate: true,
      eventStartTime: true,
      eventEndTime: true,
      eventLocation: true,
      isAllDay: true,
      color: true,
      startDate: true,
      endDate: true,
      createdAt: true,
    },
    orderBy: [
      { eventDate: "asc" },
      { startDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return {
    month,
    year,
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      description: e.excerpt || e.content?.substring(0, 100),
      type: e.type,
      priority: e.priority,
      date: e.eventDate || e.startDate,
      startTime: e.eventStartTime,
      endTime: e.eventEndTime,
      location: e.eventLocation,
      isAllDay: e.isAllDay,
      color: e.color || this.getEventColor(e.type, e.priority),
      startDate: e.startDate,
      endDate: e.endDate,
    })),
  };
}

private getEventColor(type: string, priority: string): string {
  const colorMap: Record<string, string> = {
    "EXAM": "#DC3545",       // Red
    "HOLIDAY": "#28A745",    // Green
    "EVENT": "#007BFF",      // Blue
    "MEETING": "#FFC107",    // Yellow
    "EMERGENCY": "#DC3545",  // Red
    "GENERAL": "#6C757D",    // Gray
    "FEE_DUE": "#FD7E14",    // Orange
  };
  
  if (priority === "URGENT") return "#DC3545";
  return colorMap[type] || "#1B6B4A";
}
}

export const dashboardService = new DashboardService();