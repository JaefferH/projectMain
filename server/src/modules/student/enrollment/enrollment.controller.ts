// src/modules/student/enrollment/enrollment.controller.ts
import { Request, Response } from "express";
import { enrollmentService } from "./enrollment.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";
import { storageService } from "@shared/services/storage.service";

class EnrollmentController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getEnrollments = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const studentId = typeof req.query.studentId === "string" ? req.query.studentId : undefined;
    const classroomId = typeof req.query.classroomId === "string" ? req.query.classroomId : undefined;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await enrollmentService.getEnrollments({
      page, limit, studentId, classroomId, academicTermId, academicYearId, isActive,
    });

    res.status(200).json(ApiResponse.success("Enrollments retrieved successfully.", result));
  });

  getEnrollmentById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await enrollmentService.getEnrollmentById(id);
    res.status(200).json(ApiResponse.success("Enrollment retrieved successfully.", result));
  });

  createEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const result = await enrollmentService.createEnrollment(req.body);
    res.status(201).json(ApiResponse.success("Student enrolled successfully.", result));
  });

  bulkEnrollStudents = asyncHandler(async (req: Request, res: Response) => {
    const result = await enrollmentService.bulkEnrollStudents(req.body);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await enrollmentService.updateEnrollment(id, req.body);
    res.status(200).json(ApiResponse.success("Enrollment updated successfully.", result));
  });

  deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await enrollmentService.deleteEnrollment(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  getMyEnrollments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const result = await enrollmentService.getMyEnrollments(req.user.id, { academicTermId });
    res.status(200).json(ApiResponse.success("Your enrollments retrieved successfully.", result));
  });

  getMyClassEnrollments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const classroomId = typeof req.query.classroomId === "string" ? req.query.classroomId : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await enrollmentService.getEnrollmentsByTeacherClassrooms(req.user.id, {
      page, limit, academicTermId, classroomId, isActive, search,
    });

    res.status(200).json(
      ApiResponse.success("Your class enrollments retrieved successfully.", result)
    );
  });
}

export const enrollmentController = new EnrollmentController();