// src/modules/academic/classroom/classroom.controller.ts
import { Request, Response } from "express";
import { classroomService } from "./classroom.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class ClassroomController {
  // Helper method to extract ID from params
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getClassrooms = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await classroomService.getClassrooms({
      page, limit, branchId, academicYearId, search,
    });

    res.status(200).json(ApiResponse.success("Classrooms retrieved successfully.", result));
  });

  getClassroomById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    console.log('Getting classroom by ID:', id);
    const result = await classroomService.getClassroomById(id);
    res.status(200).json(ApiResponse.success("Classroom retrieved successfully.", result));
  });

  createClassroom = asyncHandler(async (req: Request, res: Response) => {
    const result = await classroomService.createClassroom(req.body);
    res.status(201).json(ApiResponse.success("Classroom created successfully.", result));
  });

  updateClassroom = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await classroomService.updateClassroom(id, req.body);
    res.status(200).json(ApiResponse.success("Classroom updated successfully.", result));
  });

  deleteClassroom = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await classroomService.deleteClassroom(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  getClassroomsByAcademicYear = asyncHandler(async (req: Request, res: Response) => {
    const academicYearId = this.getIdFromParam(req.params.academicYearId);
    const result = await classroomService.getClassroomsByAcademicYear(academicYearId);
    res.status(200).json(ApiResponse.success("Classrooms retrieved successfully.", result));
  });
}

export const classroomController = new ClassroomController();