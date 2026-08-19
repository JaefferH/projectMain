// src/modules/academic/homeroom-teacher/homeroom-teacher.controller.ts
import { Request, Response } from "express";
import { homeroomTeacherService } from "./homeroom-teacher.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class HomeroomTeacherController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getHomeroomTeachers = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const teacherId = typeof req.query.teacherId === "string" ? req.query.teacherId : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await homeroomTeacherService.getHomeroomTeachers({
      page, limit, academicTermId, academicYearId, branchId, teacherId, isActive,
    });

    res.status(200).json(ApiResponse.success("Homeroom teachers retrieved successfully.", result));
  });

  getHomeroomTeacherById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await homeroomTeacherService.getHomeroomTeacherById(id);
    res.status(200).json(ApiResponse.success("Homeroom teacher retrieved successfully.", result));
  });

  getMyHomeroomTeacher = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const academicTermId = typeof req.query.academicTermId === "string" 
      ? req.query.academicTermId 
      : undefined;

    const result = await homeroomTeacherService.getMyHomeroomTeacher(
      req.user.id,
      academicTermId
    );

    res.status(200).json(
      ApiResponse.success("Your homeroom teacher retrieved successfully.", result)
    );
  });

  assignHomeroomTeacher = asyncHandler(async (req: Request, res: Response) => {
    const result = await homeroomTeacherService.assignHomeroomTeacher(req.body);
    res.status(201).json(ApiResponse.success("Homeroom teacher assigned successfully.", result));
  });

  updateHomeroomTeacher = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await homeroomTeacherService.updateHomeroomTeacher(id, req.body);
    res.status(200).json(ApiResponse.success("Homeroom teacher updated successfully.", result));
  });

  deactivateHomeroomTeacher = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await homeroomTeacherService.deactivateHomeroomTeacher(id);
    res.status(200).json(ApiResponse.success("Homeroom teacher deactivated successfully.", result));
  });

  deleteHomeroomTeacher = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await homeroomTeacherService.deleteHomeroomTeacher(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  getMyHomeroomAssignment = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const result = await homeroomTeacherService.getMyHomeroomAssignment(req.user.id, academicTermId);
    res.status(200).json(ApiResponse.success("Your homeroom assignment retrieved successfully.", result));
  });

  getHomeroomTeacherByClassroom = asyncHandler(async (req: Request, res: Response) => {
    const classroomId = this.getIdFromParam(req.params.classroomId);
    const academicTermId = this.getIdFromParam(req.params.academicTermId);
    
    if (!academicTermId) {
      throw new AppError("Academic term ID is required.", 400);
    }

    const result = await homeroomTeacherService.getHomeroomTeacherByClassroom(classroomId, academicTermId);
    res.status(200).json(ApiResponse.success("Homeroom teacher retrieved successfully.", result));
  });
}

export const homeroomTeacherController = new HomeroomTeacherController();