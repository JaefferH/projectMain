import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { ReportCardMapper } from "./report-card.mapper";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class ReportCardService {
  private getLetterGrade(percentage: number): string {
    if (percentage >= 90) return "A+"; if (percentage >= 85) return "A"; if (percentage >= 80) return "A-";
    if (percentage >= 75) return "B+"; if (percentage >= 70) return "B"; if (percentage >= 65) return "B-";
    if (percentage >= 60) return "C+"; if (percentage >= 55) return "C"; if (percentage >= 50) return "D";
    return "F";
  }

  private async calculateSubjectTermGrade(enrollmentId: string, subjectId: string, academicTermId: string) {
    const assessments = await prisma.assessment.findMany({
      where: { teacherAssignment: { subjectId, academicTermId, classroom: { studentEnrollments: { some: { id: enrollmentId, isActive: true } } } }, isPublished: true },
      select: { totalMarks: true, weight: true, results: { where: { enrollmentId }, select: { marksObtained: true, percentage: true } } },
    });
    if (assessments.length === 0) return null;
    let totalWeightedPercentage = 0; let totalWeight = 0;
    assessments.forEach(assessment => {
      const result = assessment.results[0];
      if (result) { const weight = Number(assessment.weight); const percentage = Number(result.percentage) || (Number(result.marksObtained) / Number(assessment.totalMarks)) * 100; totalWeightedPercentage += percentage * weight; totalWeight += weight; }
    });
    if (totalWeight === 0) return null;
    const finalPercentage = totalWeightedPercentage / totalWeight;
    return { percentage: Math.round(finalPercentage * 100) / 100, totalAssessments: assessments.length, letterGrade: this.getLetterGrade(finalPercentage) };
  }

  async getOrGenerateReportCard(enrollmentId: string, academicYearId: string, userId?: string) {
    // Check cache for existing finalized report card
    const cacheKey = `reportCard:${enrollmentId}:${academicYearId}`;
    
    // Check if report card exists and is finalized (can serve from cache)
    const existingCard = await prisma.reportCard.findUnique({
      where: { enrollmentId_academicYearId: { enrollmentId, academicYearId } },
      select: { id: true, isFinalized: true, enrollment: { select: { studentId: true, classroomId: true } } },
    });

    // If finalized, try cache
    if (existingCard?.isFinalized) {
      return CacheUtils.getOrSet(cacheKey, async () => {
        const reportCard = await prisma.reportCard.findUnique({
          where: { id: existingCard.id },
          include: {
            enrollment: { select: { id: true, studentId: true, classroomId: true, student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } } },
            academicYear: { select: { id: true, name: true } },
            grades: { include: { subject: { select: { id: true, name: true, code: true } }, academicTerm: { select: { id: true, name: true, type: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } }, orderBy: [{ academicTerm: { startDate: "asc" } }, { subject: { name: "asc" } }] },
          },
        });
        return ReportCardMapper.toDetail(reportCard!);
      }, 600); // Cache finalized report cards for 10 minutes
    }

    // If user is provided, check authorization
    if (userId && existingCard) {
      await this.authorizeReportCardAccess(userId, existingCard.enrollment);
    }

    // Not finalized or doesn't exist - generate fresh
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, studentId: true, classroomId: true, student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } },
    });
    if (!enrollment) throw new AppError("Enrollment not found.", 404);
    if (userId && !existingCard) await this.authorizeReportCardAccess(userId, enrollment);

    const terms = await prisma.academicTerm.findMany({ where: { academicYearId }, orderBy: { startDate: "asc" } });
    const subjectAssignments = await prisma.teacherAssignment.findMany({ where: { classroomId: enrollment.classroomId, academicTerm: { academicYearId } }, select: { subjectId: true, subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } } });
    const uniqueSubjects = subjectAssignments.filter((sa, index, self) => self.findIndex(s => s.subjectId === sa.subjectId) === index);

    let reportCard = existingCard;
    if (!reportCard) {
      reportCard = await prisma.reportCard.create({ data: { enrollmentId, academicYearId }, include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } } }, academicYear: { select: { id: true, name: true } }, grades: { include: { subject: true, academicTerm: true, teacher: true } } } });
    }

    // Calculate grades for each subject per term
    for (const subject of uniqueSubjects) {
      for (const term of terms) {
        const existingGrade = await prisma.reportCardSubjectGrade.findFirst({ where: { reportCardId: reportCard.id, subjectId: subject.subjectId, academicTermId: term.id } });
        if (!existingGrade) {
          const calculated = await this.calculateSubjectTermGrade(enrollmentId, subject.subjectId, term.id);
          if (calculated) {
            await prisma.reportCardSubjectGrade.create({ data: { reportCardId: reportCard.id, subjectId: subject.subjectId, academicTermId: term.id, teacherId: subject.teacher.id, totalPercentage: calculated.percentage, letterGrade: calculated.letterGrade } });
          }
        }
      }
    }

    // Refresh
    const updatedCard = await prisma.reportCard.findUnique({
      where: { id: reportCard.id },
      include: { enrollment: { select: { id: true, studentId: true, classroomId: true, student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } } }, academicYear: { select: { id: true, name: true } }, grades: { include: { subject: { select: { id: true, name: true, code: true } }, academicTerm: { select: { id: true, name: true, type: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } }, orderBy: [{ academicTerm: { startDate: "asc" } }, { subject: { name: "asc" } }] } },
    });
    if (!updatedCard) throw new AppError("Failed to generate report card.", 500);

    const allPercentages = updatedCard.grades.map(g => Number(g.totalPercentage));
    const overallPercentage = allPercentages.length > 0 ? Math.round((allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length) * 100) / 100 : null;

    let rank: number | null = null;
    if (overallPercentage && enrollment.classroomId) {
      const allCards = await prisma.reportCard.findMany({ where: { enrollment: { classroomId: enrollment.classroomId }, academicYearId, overallPercentage: { not: null } }, orderBy: { overallPercentage: "desc" }, select: { enrollmentId: true } });
      rank = allCards.findIndex(c => c.enrollmentId === enrollmentId) + 1 || null;
    }

    const finalCard = await prisma.reportCard.update({
      where: { id: reportCard.id }, data: { overallPercentage, overallGrade: overallPercentage ? this.getLetterGrade(overallPercentage) : null, rank },
      include: { enrollment: { select: { id: true, studentId: true, classroomId: true, student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } } }, academicYear: { select: { id: true, name: true } }, grades: { include: { subject: { select: { id: true, name: true, code: true } }, academicTerm: { select: { id: true, name: true, type: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } }, orderBy: [{ academicTerm: { startDate: "asc" } }, { subject: { name: "asc" } }] } },
    });

    return ReportCardMapper.toDetail(finalCard);
  }

  private async authorizeReportCardAccess(userId: string, enrollment: { studentId: string; classroomId: string }) {
    const userProfile = await prisma.userProfile.findUnique({ where: { userId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!userProfile) throw new AppError("User profile not found.", 403);
    const roles = userProfile.user.role.map(r => r.role.name);
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return;
    if (enrollment.studentId === userProfile.id) return;
    const homeroomTeacher = await prisma.homeroomTeacher.findFirst({ where: { teacherId: userProfile.id, classroomId: enrollment.classroomId, isActive: true } });
    if (homeroomTeacher) return;
    throw new AppError("You are not authorized to view this report card.", 403);
  }

  private async authorizeReportCardModification(userId: string, enrollment: { classroomId: string; studentId: string }) {
    const userProfile = await prisma.userProfile.findUnique({ where: { userId }, include: { user: { include: { role: { include: { role: true } } } } } });
    if (!userProfile) throw new AppError("User profile not found.", 403);
    const roles = userProfile.user.role.map(r => r.role.name);
    if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')) return;
    const homeroomTeacher = await prisma.homeroomTeacher.findFirst({ where: { teacherId: userProfile.id, classroomId: enrollment.classroomId, isActive: true } });
    if (!homeroomTeacher) throw new AppError("Only homeroom teachers or admins can modify report cards.", 403);
  }

  async getStudentReportCard(requestingUserId: string, enrollmentId: string, academicYearId: string) {
    const enrollment = await prisma.studentEnrollment.findUnique({ where: { id: enrollmentId }, select: { id: true, studentId: true, classroomId: true } });
    if (!enrollment) throw new AppError("Enrollment not found.", 404);
    await this.authorizeReportCardAccess(requestingUserId, enrollment);
    return this.getOrGenerateReportCard(enrollmentId, academicYearId);
  }

  async finalizeReportCard(reportCardId: string, userId: string, data: { homeroomRemarks?: string; principalRemarks?: string; remarks?: string }) {
    const reportCard = await prisma.reportCard.findUnique({ where: { id: reportCardId }, select: { id: true, isFinalized: true, enrollment: { select: { classroomId: true, studentId: true } } } });
    if (!reportCard) throw new AppError("Report card not found.", 404);
    if (reportCard.isFinalized) throw new AppError("Report card is already finalized.", 400);

    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (teacherProfile) {
      const homeroomTeacher = await prisma.homeroomTeacher.findFirst({ where: { teacherId: teacherProfile.id, classroomId: reportCard.enrollment.classroomId, isActive: true } });
      if (!homeroomTeacher) throw new AppError("Only the homeroom teacher can finalize report cards.", 403);
    }

    const updated = await prisma.reportCard.update({
      where: { id: reportCardId }, data: { isFinalized: true, finalizedAt: new Date(), finalizedBy: userId, ...(data.homeroomRemarks && { homeroomRemarks: data.homeroomRemarks }), ...(data.principalRemarks && { principalRemarks: data.principalRemarks }), ...(data.remarks && { remarks: data.remarks }) },
      include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } }, classroom: { select: { id: true, name: true } } } }, academicYear: { select: { id: true, name: true } }, grades: { include: { subject: { select: { id: true, name: true, code: true } }, academicTerm: { select: { id: true, name: true, type: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } }, orderBy: [{ academicTerm: { startDate: "asc" } }, { subject: { name: "asc" } }] } },
    });

    // Invalidate report card cache
    await CacheUtils.delete(`reportCard:${reportCard.enrollmentId}:*`);
    return ReportCardMapper.toDetail(updated);
  }

  async regenerateReportCard(requestingUserId: string, enrollmentId: string, academicYearId: string) {
    const enrollment = await prisma.studentEnrollment.findUnique({ where: { id: enrollmentId }, select: { id: true, classroomId: true, studentId: true } });
    if (!enrollment) throw new AppError("Enrollment not found.", 404);
    await this.authorizeReportCardModification(requestingUserId, enrollment);

    const reportCard = await prisma.reportCard.findUnique({ where: { enrollmentId_academicYearId: { enrollmentId, academicYearId } } });
    if (reportCard?.isFinalized) throw new AppError("Cannot regenerate a finalized report card.", 400);
    if (reportCard) await prisma.reportCardSubjectGrade.deleteMany({ where: { reportCardId: reportCard.id } });

    // Invalidate cache
    await CacheUtils.delete(`reportCard:${enrollmentId}:${academicYearId}`);
    return this.getOrGenerateReportCard(enrollmentId, academicYearId);
  }

  async getMyReportCard(userId: string, academicYearId?: string) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);
    const enrollment = await prisma.studentEnrollment.findFirst({ where: { studentId: studentProfile.id, isActive: true }, include: { academicTerm: { select: { academicYearId: true } } }, orderBy: { createdAt: "desc" } });
    if (!enrollment) throw new AppError("No active enrollment found.", 404);
    const yearId = academicYearId || enrollment.academicTerm.academicYearId;

    const reportCard = await prisma.reportCard.findUnique({ where: { enrollmentId_academicYearId: { enrollmentId: enrollment.id, academicYearId: yearId } }, select: { id: true, isFinalized: true } });

    if (!reportCard || !reportCard.isFinalized) {
      return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, status: reportCard ? "pending" : "not_generated", message: reportCard ? "Your report card is being prepared. Please check back later." : "Your report card has not been generated yet.", reportCard: null };
    }

    return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, status: "finalized", message: null, reportCard: await this.getOrGenerateReportCard(enrollment.id, yearId, userId) };
  }

  async getClassReportCards(teacherUserId: string, academicYearId: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);
    const homeroomTeacher = await prisma.homeroomTeacher.findFirst({ where: { teacherId: teacherProfile.id, isActive: true }, select: { classroom: { select: { id: true, name: true } } } });
    if (!homeroomTeacher) throw new AppError("You are not a homeroom teacher.", 403);

    const cacheKey = `reportCards:class:${homeroomTeacher.classroom.id}:${academicYearId}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const enrollments = await prisma.studentEnrollment.findMany({ where: { classroomId: homeroomTeacher.classroom.id, isActive: true }, select: { id: true, student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } }, orderBy: { student: { fullName: "asc" } } });
      const reportCards = [];
      for (const enrollment of enrollments) {
        const card = await this.getOrGenerateReportCard(enrollment.id, academicYearId);
        reportCards.push(card);
      }
      return { classroom: homeroomTeacher.classroom, academicYearId, students: reportCards, summary: { totalStudents: enrollments.length, finalizedCards: reportCards.filter((c: any) => c.isFinalized).length } };
    }, 120);
  }
}

export const reportCardService = new ReportCardService();