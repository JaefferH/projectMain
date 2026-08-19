// src/modules/assessment/assessment/assessment.service.ts
import { prisma } from "@config/prisma";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../../shared/errors/AppError";
import { AssessmentMapper } from "./assessment.mapper";
import { CreateAssessmentDto, CreateAssessmentResultsDto, UpdateAssessmentResultDto } from "./assessment.validation";
import { CacheUtils } from "@shared/utils/cache.utils";

class AssessmentService {
  async getAssessments(params: {
    classroomId?: string; academicTermId?: string; teacherAssignmentId?: string;
    type?: string; isPublished?: boolean; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1; const limit = params.limit ?? 10;
    const cacheKey = `assessments:list:${page}:${limit}:${params.classroomId || 'all'}:${params.academicTermId || 'all'}:${params.type || 'all'}:${params.isPublished ?? 'all'}`;
    
    return CacheUtils.getOrSet(cacheKey, async () => {
      const skip = (page - 1) * limit;
      const where: any = {
        ...(params.classroomId && { classroomId: params.classroomId }),
        ...(params.academicTermId && { academicTermId: params.academicTermId }),
        ...(params.teacherAssignmentId && { teacherAssignmentId: params.teacherAssignmentId }),
        ...(params.type && { type: params.type as any }),
        ...(params.isPublished !== undefined && { isPublished: params.isPublished }),
      };

      const [assessments, total] = await prisma.$transaction([
        prisma.assessment.findMany({
          where, skip, take: limit,
          include: {
            teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
            classroom: { select: { id: true, name: true } },
            academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
            _count: { select: { results: true } },
          },
          orderBy: { assessmentDate: "desc" },
        }),
        prisma.assessment.count({ where }),
      ]);

      return { items: AssessmentMapper.toList(assessments as any), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }, 120);
  }

  async getAssessmentById(id: string) {
    return CacheUtils.getOrSet(`assessment:${id}`, async () => {
      const assessment = await prisma.assessment.findUnique({
        where: { id },
        include: {
          teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
          classroom: { select: { id: true, name: true } },
          academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
          results: { include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
        },
      });
      if (!assessment) throw new AppError("Assessment not found.", 404);
      return { ...AssessmentMapper.toResponse(assessment as any), results: AssessmentMapper.toResultList(assessment.results) };
    }, 300);
  }

  async createAssessment(data: CreateAssessmentDto, userId?: string) {
    if (userId) {
      const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
      if (teacherProfile) {
        const assignment = await prisma.teacherAssignment.findUnique({ where: { id: data.teacherAssignmentId } });
        if (assignment && assignment.teacherId !== teacherProfile.id) throw new AppError("You can only create assessments for your own assignments.", 403);
      }
    }

    const teacherAssignment = await prisma.teacherAssignment.findUnique({ where: { id: data.teacherAssignmentId } });
    if (!teacherAssignment) throw new AppError("Teacher assignment not found.", 404);

    const assessment = await prisma.assessment.create({
      data: { teacherAssignmentId: data.teacherAssignmentId, classroomId: data.classroomId, academicTermId: data.academicTermId, title: data.title, type: data.type as any, totalMarks: data.totalMarks, weight: data.weight, assessmentDate: new Date(data.assessmentDate) },
      include: {
        teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
        classroom: { select: { id: true, name: true } },
        academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
        _count: { select: { results: true } },
      },
    });

    await this.invalidateAssessmentCaches(data.classroomId, data.academicTermId);
    return AssessmentMapper.toResponse(assessment as any);
  }

  async addAssessmentResults(assessmentId: string, data: CreateAssessmentResultsDto, userId?: string) {
    const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId }, select: { classroomId: true, isPublished: true, totalMarks: true, teacherAssignment: { select: { teacherId: true } } } });
    if (!assessment) throw new AppError("Assessment not found.", 404);
    if (userId) {
      const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
      if (teacherProfile && assessment.teacherAssignment.teacherId !== teacherProfile.id) throw new AppError("You can only add results to your own assessments.", 403);
    }
    if (assessment.isPublished) throw new AppError("Cannot modify results of a published assessment.", 400);

    const enrollmentIds = data.results.map(r => r.enrollmentId);
    const enrollments = await prisma.studentEnrollment.findMany({ where: { id: { in: enrollmentIds }, classroomId: assessment.classroomId, isActive: true } });
    if (enrollments.length !== enrollmentIds.length) throw new AppError("One or more enrollment IDs are invalid.", 400);

    const totalMarks = Number(assessment.totalMarks);
    const results = await prisma.$transaction(data.results.map(result => {
      const percentage = (result.marksObtained / totalMarks) * 100;
      return prisma.assessmentResult.upsert({
        where: { assessmentId_enrollmentId: { assessmentId, enrollmentId: result.enrollmentId } },
        update: { marksObtained: result.marksObtained, percentage: Math.round(percentage * 100) / 100, remarks: result.remarks },
        create: { assessmentId, enrollmentId: result.enrollmentId, marksObtained: result.marksObtained, percentage: Math.round(percentage * 100) / 100, remarks: result.remarks },
        include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } },
      });
    }));

    await CacheUtils.delete(`assessment:${assessmentId}`);
    return AssessmentMapper.toResultList(results);
  }

  async updateAssessmentResult(resultId: string, data: UpdateAssessmentResultDto, userId?: string) {
    const result = await prisma.assessmentResult.findUnique({ where: { id: resultId }, include: { assessment: { select: { isPublished: true, totalMarks: true, teacherAssignment: { select: { teacherId: true } } } } } });
    if (!result) throw new AppError("Assessment result not found.", 404);
    if (userId) {
      const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
      if (teacherProfile && result.assessment.teacherAssignment.teacherId !== teacherProfile.id) throw new AppError("You can only update results for your own assessments.", 403);
    }
    if (result.assessment.isPublished) throw new AppError("Cannot modify results of a published assessment.", 400);

    const totalMarks = Number(result.assessment.totalMarks);
    const percentage = (data.marksObtained / totalMarks) * 100;
    const updated = await prisma.assessmentResult.update({
      where: { id: resultId },
      data: { marksObtained: data.marksObtained, percentage: Math.round(percentage * 100) / 100, remarks: data.remarks },
      include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } },
    });

    await CacheUtils.delete(`assessment:${result.assessmentId}`);
    return AssessmentMapper.toResultResponse(updated);
  }

  async publishAssessment(id: string, userId?: string) {
    const assessment = await prisma.assessment.findUnique({ where: { id }, include: { _count: { select: { results: true } }, teacherAssignment: true } });
    if (!assessment) throw new AppError("Assessment not found.", 404);
    if (assessment._count.results === 0) throw new AppError("Cannot publish assessment with no results.", 400);
    if (userId) {
      const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
      if (teacherProfile && assessment.teacherAssignment.teacherId !== teacherProfile.id) throw new AppError("You can only publish your own assessments.", 403);
    }

    const updated = await prisma.assessment.update({
      where: { id }, data: { isPublished: true, publishedAt: new Date() } as any,
      include: {
        teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } } },
        classroom: { select: { id: true, name: true } },
        academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } },
        results: { include: { enrollment: { select: { student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } } } } }, orderBy: { enrollment: { student: { fullName: "asc" } } } },
      },
    });

    await Promise.all([CacheUtils.delete(`assessment:${id}`), CacheUtils.invalidatePattern('assessments:list:*'), CacheUtils.invalidatePattern('assessments:my:*'), CacheUtils.invalidatePattern('dashboard:*')]);
    return { ...AssessmentMapper.toResponse(updated as any), results: AssessmentMapper.toResultList(updated.results) };
  }

  async deleteAssessment(id: string | undefined) {
    const assessment = await prisma.assessment.findUnique({ where: { id } });
    if (!assessment) throw new AppError("Assessment not found.", 404);
    if (assessment.isPublished) throw new AppError("Cannot delete a published assessment.", 400);

    await prisma.assessmentResult.deleteMany({ where: { assessmentId: id } });
    await prisma.assessment.delete({ where: { id } });
    await this.invalidateAssessmentCaches(assessment.classroomId, assessment.academicTermId, id, true);
    return { message: "Assessment deleted successfully." };
  }

  // ==================== USER-SPECIFIC VIEWS ====================

  async getMyAssessments(userId: string, academicTermId?: string) {
    const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!studentProfile) throw new AppError("Student profile not found.", 404);

    const enrollmentWhere: any = { studentId: studentProfile.id, isActive: true };
    if (academicTermId) enrollmentWhere.academicTermId = academicTermId;

    const enrollment = await prisma.studentEnrollment.findFirst({ where: enrollmentWhere, select: { id: true, classroom: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } });
    if (!enrollment) return { student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber }, hasEnrollment: false, assessments: [] };

    const cacheKey = `assessments:my:${studentProfile.id}:${academicTermId || 'current'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const assessments = await prisma.assessment.findMany({
        where: { classroomId: enrollment.classroom.id, isPublished: true },
        select: { id: true, title: true, type: true, totalMarks: true, weight: true, assessmentDate: true, isPublished: true, teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true } } } }, results: { where: { enrollmentId: enrollment.id }, select: { id: true, marksObtained: true, percentage: true, remarks: true } } },
        orderBy: { assessmentDate: "desc" },
      });

      return {
        student: { id: studentProfile.id, fullName: studentProfile.fullName, registrationNumber: studentProfile.registrationNumber },
        classroom: enrollment.classroom,
        assessments: assessments.map(a => ({ id: a.id, title: a.title, type: a.type, totalMarks: Number(a.totalMarks), weight: Number(a.weight), assessmentDate: a.assessmentDate, isPublished: a.isPublished, subject: a.teacherAssignment?.subject, teacher: a.teacherAssignment?.teacher, myResult: a.results[0] ? { id: a.results[0].id, marksObtained: Number(a.results[0].marksObtained), percentage: a.results[0].percentage ? Number(a.results[0].percentage) : null, remarks: a.results[0].remarks } : null })),
        summary: { totalAssessments: assessments.length, assessmentsWithResults: assessments.filter(a => a.results.length > 0).length },
      };
    }, 120);
  }

  async getMyTeacherAssessments(userId: string, academicTermId?: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

    const cacheKey = `assessments:teacher:${teacherProfile.id}:${academicTermId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const where: any = { teacherAssignment: { teacherId: teacherProfile.id } };
      if (academicTermId) where.academicTermId = academicTermId;
      const assessments = await prisma.assessment.findMany({ where, include: { teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } } } }, classroom: { select: { id: true, name: true } }, academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } }, _count: { select: { results: true } } }, orderBy: { assessmentDate: "desc" } });
      return AssessmentMapper.toList(assessments as any);
    }, 120);
  }

  async getHomeroomClassAssessments(userId: string, academicTermId?: string) {
    const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
    if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);
    const homeroomWhere: any = { teacherId: teacherProfile.id, isActive: true };
    if (academicTermId) homeroomWhere.academicTermId = academicTermId;
    const homeroomTeacher = await prisma.homeroomTeacher.findFirst({ where: homeroomWhere, select: { classroom: { select: { id: true, name: true } } } });
    if (!homeroomTeacher) throw new AppError("You are not assigned as a homeroom teacher.", 403);

    const cacheKey = `assessments:homeroom:${homeroomTeacher.classroom.id}:${academicTermId || 'all'}`;
    return CacheUtils.getOrSet(cacheKey, async () => {
      const assessments = await prisma.assessment.findMany({ where: { classroomId: homeroomTeacher.classroom.id }, include: { teacherAssignment: { select: { subject: { select: { id: true, name: true, code: true } }, teacher: { select: { id: true, fullName: true, employeeNumber: true } } } }, academicTerm: { select: { id: true, name: true, academicYear: { select: { id: true, name: true } } } }, _count: { select: { results: true } } }, orderBy: { assessmentDate: "desc" } });
      return { classroom: homeroomTeacher.classroom, assessments: AssessmentMapper.toList(assessments as any) };
    }, 120);
  }

async getMyAssessmentResult(userId: string, assessmentId: string) {
  const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!studentProfile) throw new AppError("Student profile not found.", 404);

  // Get student's active enrollment
  const enrollment = await prisma.studentEnrollment.findFirst({
    where: { studentId: studentProfile.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) throw new AppError("No active enrollment found.", 404);

  // Check if assessment is published
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, isPublished: true, classroomId: true },
  });

  if (!assessment) throw new AppError("Assessment not found.", 404);
  if (!assessment.isPublished) throw new AppError("Assessment results are not yet published.", 404);
  if (assessment.classroomId !== enrollment.classroomId) {
    throw new AppError("This assessment is not for your class.", 403);
  }

  // Get the student's result
  const result = await prisma.assessmentResult.findFirst({
    where: {
      assessmentId,
      enrollmentId: enrollment.id,
    },
    include: {
      assessment: {
        select: {
          id: true,
          title: true,
          type: true,
          totalMarks: true,
          weight: true,
          assessmentDate: true,
          teacherAssignment: {
            select: {
              subject: { select: { id: true, name: true, code: true } },
              teacher: { select: { id: true, fullName: true, employeeNumber: true } },
            },
          },
        },
      },
    },
  });

  if (!result) {
    return {
      student: { id: studentProfile.id, fullName: studentProfile.fullName },
      assessment: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        totalMarks: assessment.totalMarks,
        weight: assessment.weight,
        assessmentDate: assessment.assessmentDate,
      },
      hasResult: false,
      message: "No result found for this assessment.",
    };
  }

  return {
    student: { id: studentProfile.id, fullName: studentProfile.fullName },
    assessment: {
      id: result.assessment.id,
      title: result.assessment.title,
      type: result.assessment.type,
      totalMarks: Number(result.assessment.totalMarks),
      weight: Number(result.assessment.weight),
      assessmentDate: result.assessment.assessmentDate,
      subject: result.assessment.teacherAssignment?.subject,
      teacher: result.assessment.teacherAssignment?.teacher,
    },
    hasResult: true,
    result: {
      id: result.id,
      marksObtained: Number(result.marksObtained),
      percentage: result.percentage ? Number(result.percentage) : null,
      remarks: result.remarks,
    },
  };
}

/**
 * Student views all their results for a specific subject in a term
 */
async getMySubjectResults(userId: string, subjectId: string, academicTermId?: string) {
  const studentProfile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!studentProfile) throw new AppError("Student profile not found.", 404);

  // Get enrollment
  const enrollmentWhere: any = { studentId: studentProfile.id, isActive: true };
  if (academicTermId) enrollmentWhere.academicTermId = academicTermId;

  const enrollment = await prisma.studentEnrollment.findFirst({
    where: enrollmentWhere,
    select: {
      id: true,
      classroomId: true,
      academicTermId: true,
      classroom: { select: { id: true, name: true } },
      academicTerm: {
        select: {
          id: true, name: true, type: true,
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!enrollment) throw new AppError("No active enrollment found.", 404);

  // DIRECT QUERY: Get all assessments for this classroom and term
  const allAssessments = await prisma.assessment.findMany({
    where: {
      classroomId: enrollment.classroomId,
      academicTermId: enrollment.academicTermId,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      type: true,
      totalMarks: true,
      weight: true,
      assessmentDate: true,
      teacherAssignmentId: true,
      teacherAssignment: {
        select: {
          subjectId: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { assessmentDate: "asc" },
  });

  // Filter to only this subject
  const subjectAssessments = allAssessments.filter(
    a => a.teacherAssignment?.subjectId === subjectId
  );

  console.log(`Found ${allAssessments.length} total assessments, ${subjectAssessments.length} for this subject`);

  // Get results for this student
  const assessmentIds = subjectAssessments.map(a => a.id);
  const results = await prisma.assessmentResult.findMany({
    where: {
      assessmentId: { in: assessmentIds },
      enrollmentId: enrollment.id,
    },
    select: {
      id: true,
      assessmentId: true,
      marksObtained: true,
      percentage: true,
      remarks: true,
    },
  });

  // Map results to assessments
  const resultMap = new Map(results.map(r => [r.assessmentId, r]));

  const mappedResults = subjectAssessments.map(a => {
    const result = resultMap.get(a.id);
    return {
      assessmentId: a.id,
      title: a.title,
      type: a.type,
      totalMarks: Number(a.totalMarks),
      weight: Number(a.weight),
      assessmentDate: a.assessmentDate,
      result: result ? {
        marksObtained: Number(result.marksObtained),
        percentage: result.percentage ? Number(result.percentage) : null,
        remarks: result.remarks,
      } : null,
    };
  });

  // Calculate overall
  let totalWeightedPercentage = 0;
  let totalWeight = 0;
  mappedResults.forEach(r => {
    if (r.result?.percentage && r.weight > 0) {
      totalWeightedPercentage += r.result.percentage * r.weight;
      totalWeight += r.weight;
    }
  });

  const overallPercentage = totalWeight > 0 
    ? Math.round((totalWeightedPercentage / totalWeight) * 100) / 100 
    : null;

  return {
    student: { id: studentProfile.id, fullName: studentProfile.fullName },
    enrollment: {
      classroom: enrollment.classroom,
      academicTerm: enrollment.academicTerm,
    },
    subject: await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, code: true },
    }),
    results: mappedResults,
    overall: {
      percentage: overallPercentage,
      letterGrade: overallPercentage ? this.getLetterGrade(overallPercentage) : null,
      totalAssessments: mappedResults.length,
      assessmentsWithResults: mappedResults.filter(r => r.result).length,
    },
  };
}

private getLetterGrade(percentage: number): string {
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

/**
 * Teacher views results for a specific assessment (full class)
 */
async getAssessmentResultsForTeacher(userId: string, assessmentId: string) {
  const teacherProfile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      teacherAssignment: {
        select: {
          teacherId: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
      classroom: { select: { id: true, name: true } },
      academicTerm: {
        select: {
          id: true, name: true,
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!assessment) throw new AppError("Assessment not found.", 404);

  // Check if this teacher owns this assessment or is homeroom teacher
  const isOwner = assessment.teacherAssignment.teacherId === teacherProfile.id;
  let isHomeroom = false;

  if (!isOwner) {
    const homeroomTeacher = await prisma.homeroomTeacher.findFirst({
      where: {
        teacherId: teacherProfile.id,
        classroomId: assessment.classroomId,
        isActive: true,
      },
    });
    isHomeroom = !!homeroomTeacher;
  }

  if (!isOwner && !isHomeroom) {
    throw new AppError("You can only view results for your own assessments or your homeroom class.", 403);
  }

  // Get all results
  const results = await prisma.assessmentResult.findMany({
    where: { assessmentId },
    include: {
      enrollment: {
        select: {
          student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } },
        },
      },
    },
    orderBy: { enrollment: { student: { fullName: "asc" } } },
  });

  // Get students without results
  const allEnrollments = await prisma.studentEnrollment.findMany({
    where: { classroomId: assessment.classroomId, isActive: true },
    select: {
      id: true,
      student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } },
    },
  });

  const studentsWithResults = new Set(results.map(r => r.enrollmentId));
  const studentsWithoutResults = allEnrollments.filter(e => !studentsWithResults.has(e.id));

  // Statistics
  const marks = results.map(r => Number(r.marksObtained));
  const totalMarks = Number(assessment.totalMarks);

  return {
    assessment: {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      totalMarks,
      weight: Number(assessment.weight),
      assessmentDate: assessment.assessmentDate,
      isPublished: assessment.isPublished,
      subject: assessment.teacherAssignment.subject,
      classroom: assessment.classroom,
      academicTerm: assessment.academicTerm,
    },
    results: AssessmentMapper.toResultList(results),
    pendingStudents: studentsWithoutResults.map(e => ({
      enrollmentId: e.id,
      student: e.student,
    })),
    statistics: {
      totalStudents: allEnrollments.length,
      submittedResults: results.length,
      pendingResults: studentsWithoutResults.length,
      highest: marks.length > 0 ? Math.max(...marks) : null,
      lowest: marks.length > 0 ? Math.min(...marks) : null,
      average: marks.length > 0 
        ? Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 100) / 100 
        : null,
      passRate: marks.length > 0 && totalMarks > 0
        ? Math.round((marks.filter(m => (m / totalMarks) * 100 >= 50).length / marks.length) * 100)
        : null,
    },
  };
}

/**
 * Homeroom teacher views all subject results for a student
 */
async getStudentAllResultsForHomeroom(teacherUserId: string, enrollmentId: string) {
  const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
  if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      classroomId: true,
      academicTermId: true,
      student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } },
      classroom: { select: { id: true, name: true } },
      academicTerm: {
        select: {
          id: true, name: true, type: true,
          academicYear: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!enrollment) throw new AppError("Enrollment not found.", 404);

  // Verify homeroom teacher - SIMPLIFIED CHECK
  const homeroomTeacher = await prisma.homeroomTeacher.findFirst({
    where: {
      teacherId: teacherProfile.id,
      classroomId: enrollment.classroomId,
      isActive: true,
    },
  });

  // Also allow admin and the subject teacher to view
  const isAdmin = teacherProfile.user?.role?.some(
    (r: any) => r.role.name === 'ADMIN' || r.role.name === 'SUPER_ADMIN'
  );

  if (!homeroomTeacher && !isAdmin) {
    throw new AppError("You are not authorized to view this student's results.", 403);
  }

  // DIRECT QUERY: Get all assessments for this classroom and term
  const allAssessments = await prisma.assessment.findMany({
    where: {
      classroomId: enrollment.classroomId,
      academicTermId: enrollment.academicTermId,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      type: true,
      totalMarks: true,
      weight: true,
      assessmentDate: true,
      teacherAssignment: {
        select: {
          subjectId: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
    orderBy: { assessmentDate: "asc" },
  });

  console.log(`Homeroom: Found ${allAssessments.length} assessments for classroom ${enrollment.classroomId}`);

  // Get all results for this student
  const assessmentIds = allAssessments.map(a => a.id);
  const results = await prisma.assessmentResult.findMany({
    where: {
      assessmentId: { in: assessmentIds },
      enrollmentId: enrollment.id,
    },
    select: {
      id: true,
      assessmentId: true,
      marksObtained: true,
      percentage: true,
      remarks: true,
    },
  });

  const resultMap = new Map(results.map(r => [r.assessmentId, r]));

  // Group by subject
  const subjectMap = new Map<string, any>();
  
  allAssessments.forEach(a => {
    const subjectId = a.teacherAssignment?.subjectId;
    const subject = a.teacherAssignment?.subject;
    if (!subjectId || !subject) return;

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subject,
        assessments: [],
      });
    }

    const result = resultMap.get(a.id);
    subjectMap.get(subjectId).assessments.push({
      assessmentId: a.id,
      title: a.title,
      type: a.type,
      totalMarks: Number(a.totalMarks),
      weight: Number(a.weight),
      assessmentDate: a.assessmentDate,
      marksObtained: result ? Number(result.marksObtained) : null,
      percentage: result?.percentage ? Number(result.percentage) : null,
      remarks: result?.remarks,
    });
  });

  // Calculate overall per subject
  const subjects = Array.from(subjectMap.values()).map(s => {
    let totalWeightedPercentage = 0;
    let totalWeight = 0;
    s.assessments.forEach((a: any) => {
      if (a.percentage && a.weight > 0) {
        totalWeightedPercentage += a.percentage * a.weight;
        totalWeight += a.weight;
      }
    });
    return {
      ...s,
      overall: totalWeight > 0 ? {
        percentage: Math.round((totalWeightedPercentage / totalWeight) * 100) / 100,
        letterGrade: this.getLetterGrade(totalWeightedPercentage / totalWeight),
      } : null,
    };
  });

  return {
    student: enrollment.student,
    classroom: enrollment.classroom,
    academicTerm: enrollment.academicTerm,
    subjects,
  };
}

/**
 * Teacher views all results for a subject in their class
 * NEW ENDPOINT
 */
async getSubjectResultsForTeacher(
  teacherUserId: string,
  subjectId: string,
  classroomId: string,
  academicTermId: string
) {
  const teacherProfile = await prisma.userProfile.findUnique({ where: { userId: teacherUserId } });
  if (!teacherProfile) throw new AppError("Teacher profile not found.", 404);

  // Check if teacher has permission (teaches this subject OR is homeroom OR is admin)
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacherProfile.id,
      subjectId,
      classroomId,
      academicTermId,
    },
  });

  const homeroomTeacher = await prisma.homeroomTeacher.findFirst({
    where: {
      teacherId: teacherProfile.id,
      classroomId,
      isActive: true,
    },
  });

  // Get user roles for admin check
  const user = await prisma.user.findUnique({
    where: { id: teacherUserId },
    include: { role: { include: { role: true } } },
  });
  
  const isAdmin = user?.role?.some(
    (r: any) => r.role.name === 'ADMIN' || r.role.name === 'SUPER_ADMIN'
  );

  if (!assignment && !homeroomTeacher && !isAdmin) {
    throw new AppError("You don't have permission to view these results.", 403);
  }

  // DIRECT QUERY: Get all assessments for this subject, classroom, and term
  const allAssessments = await prisma.assessment.findMany({
    where: {
      classroomId,
      academicTermId,
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      type: true,
      totalMarks: true,
      weight: true,
      assessmentDate: true,
      teacherAssignment: {
        select: {
          subjectId: true,
        },
      },
    },
    orderBy: { assessmentDate: "asc" },
  });

  // Filter to this subject
  const subjectAssessments = allAssessments.filter(
    a => a.teacherAssignment?.subjectId === subjectId
  );

  console.log(`Subject results: Found ${allAssessments.length} total, ${subjectAssessments.length} for this subject`);

  // Get all enrolled students
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { classroomId, academicTermId, isActive: true },
    select: {
      id: true,
      student: { select: { id: true, fullName: true, registrationNumber: true, photoUrl: true } },
    },
    orderBy: { student: { fullName: "asc" } },
  });

  // Get all results for these assessments
  const assessmentIds = subjectAssessments.map(a => a.id);
  const allResults = await prisma.assessmentResult.findMany({
    where: {
      assessmentId: { in: assessmentIds },
    },
    select: {
      id: true,
      assessmentId: true,
      enrollmentId: true,
      marksObtained: true,
      percentage: true,
      remarks: true,
    },
  });

  // Group results by enrollment
  const resultsByEnrollment = new Map<string, Map<string, any>>();
  allResults.forEach(r => {
    if (!resultsByEnrollment.has(r.enrollmentId)) {
      resultsByEnrollment.set(r.enrollmentId, new Map());
    }
    resultsByEnrollment.get(r.enrollmentId)!.set(r.assessmentId, r);
  });

  // Build student result matrix
  const studentResults = enrollments.map(enrollment => {
    const enrollmentResults = resultsByEnrollment.get(enrollment.id) || new Map();
    
    const results = subjectAssessments.map(assessment => {
      const result = enrollmentResults.get(assessment.id);
      return {
        assessmentId: assessment.id,
        title: assessment.title,
        type: assessment.type,
        totalMarks: Number(assessment.totalMarks),
        weight: Number(assessment.weight),
        assessmentDate: assessment.assessmentDate,
        marksObtained: result ? Number(result.marksObtained) : null,
        percentage: result?.percentage ? Number(result.percentage) : null,
        remarks: result?.remarks,
      };
    });

    // Calculate overall
    let totalWeightedPercentage = 0;
    let totalWeight = 0;
    results.forEach(r => {
      if (r.percentage && r.weight > 0) {
        totalWeightedPercentage += r.percentage * r.weight;
        totalWeight += r.weight;
      }
    });

    return {
      enrollmentId: enrollment.id,
      student: enrollment.student,
      results,
      overall: totalWeight > 0 ? {
        percentage: Math.round((totalWeightedPercentage / totalWeight) * 100) / 100,
        letterGrade: this.getLetterGrade(totalWeightedPercentage / totalWeight),
      } : null,
    };
  });

  // Statistics
  const allMarks = studentResults
    .filter(s => s.overall?.percentage)
    .map(s => s.overall!.percentage);

  return {
    subject: await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, code: true },
    }),
    classroom: await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, name: true },
    }),
    academicTerm: await prisma.academicTerm.findUnique({
      where: { id: academicTermId },
      select: { id: true, name: true, type: true },
    }),
    assessments: subjectAssessments.map(a => ({
      id: a.id,
      title: a.title,
      type: a.type,
      totalMarks: Number(a.totalMarks),
      weight: Number(a.weight),
      assessmentDate: a.assessmentDate,
    })),
    students: studentResults,
    statistics: {
      totalStudents: enrollments.length,
      studentsWithResults: studentResults.filter(s => s.overall?.percentage).length,
      highest: allMarks.length > 0 ? Math.max(...allMarks) : null,
      lowest: allMarks.length > 0 ? Math.min(...allMarks) : null,
      average: allMarks.length > 0 
        ? Math.round((allMarks.reduce((a, b) => a + b, 0) / allMarks.length) * 100) / 100 
        : null,
      passRate: allMarks.length > 0
        ? Math.round((allMarks.filter(m => m >= 50).length / allMarks.length) * 100)
        : null,
    },
  };
}
private async invalidateAssessmentCaches(classroomId: string, academicTermId: string, assessmentId?: string, isDelete: boolean = false) {
    const keysToDelete: string[] = [
      'assessments:list:*', 'assessments:my:*', 'assessments:teacher:*', 'assessments:homeroom:*',
      `classroom:${classroomId}`, 'dashboard:*', 'reportCards:*',
    ];
    if (assessmentId) keysToDelete.push(`assessment:${assessmentId}`);
    await Promise.all(keysToDelete.map(key => key.includes('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)));
  }
}

export const assessmentService = new AssessmentService();