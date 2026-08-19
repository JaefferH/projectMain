// src/modules/assessment/report-card/report-card.mapper.ts
export class ReportCardMapper {
  static toDetail(card: any) {
    const terms = [...new Set<string>(card.grades?.map((g: any) => g.academicTerm?.id) || [])];
    const subjects = [...new Set<string>(card.grades?.map((g: any) => g.subjectId) || [])];

    const subjectGrades = subjects.map((subjectId: string) => {
      const grades = card.grades.filter((g: any) => g.subjectId === subjectId);
      const subject = grades[0]?.subject;
      const teacher = grades[0]?.teacher;

      const termGrades: Record<string, any> = {};
      let totalPercentage = 0;
      let gradeCount = 0;

      grades.forEach((g: any) => {
        termGrades[g.academicTerm.id] = {
          termId: g.academicTerm.id,
          termName: g.academicTerm.name,
          termType: g.academicTerm.type,
          percentage: Number(g.totalPercentage),
          letterGrade: g.letterGrade,
        };
        totalPercentage += Number(g.totalPercentage);
        gradeCount++;
      });

      return {
        subject,
        teacher,
        termGrades,
        average: gradeCount > 0 ? Math.round((totalPercentage / gradeCount) * 100) / 100 : null,
        averageGrade: gradeCount > 0 ? getLetterGrade(totalPercentage / gradeCount) : null,
      };
    });

    return {
      id: card.id,
      enrollmentId: card.enrollmentId,
      academicYear: card.academicYear,
      student: card.enrollment?.student,
      classroom: card.enrollment?.classroom,
      terms: terms.map((t: any) => ({
        id: t,
        name: card.grades?.find((g: any) => g.academicTerm?.id === t)?.academicTerm?.name,
      })),
      subjectGrades,
      overall: {
        percentage: card.overallPercentage ? Number(card.overallPercentage) : null,
        grade: card.overallGrade,
        rank: card.rank,
      },
      remarks: {
        homeroom: card.homeroomRemarks,
        principal: card.principalRemarks,
        general: card.remarks,
      },
      isFinalized: card.isFinalized,
      finalizedAt: card.finalizedAt,
    };
  }

  static toList(cards: any[]) {
    return cards.map(c => this.toDetail(c));
  }
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 85) return "A";
  if (percentage >= 80) return "A-";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "B-";
  if (percentage >= 60) return "C+";
  if (percentage >= 55) return "C";
  if (percentage >= 50) return "D";
  return "F";
}