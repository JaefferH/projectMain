// src/modules/academic/teacher-assignment/teacher-assignment.controller.ts
import { Request, Response } from "express";
import { teacherAssignmentService } from "./teacher-assignment.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class TeacherAssignmentController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const teacherId = typeof req.query.teacherId === "string" ? req.query.teacherId : undefined;
    const subjectId = typeof req.query.subjectId === "string" ? req.query.subjectId : undefined;
    const classroomId = typeof req.query.classroomId === "string" ? req.query.classroomId : undefined;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;

    const result = await teacherAssignmentService.getTeacherAssignments({
      page, limit, teacherId, subjectId, classroomId, academicTermId, academicYearId, branchId,
    });

    res.status(200).json(ApiResponse.success("Teacher assignments retrieved successfully.", result));
  });

  getTeacherAssignmentById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await teacherAssignmentService.getTeacherAssignmentById(id);
    res.status(200).json(ApiResponse.success("Teacher assignment retrieved successfully.", result));
  });

  createTeacherAssignment = asyncHandler(async (req: Request, res: Response) => {
    const result = await teacherAssignmentService.createTeacherAssignment(req.body);
    res.status(201).json(ApiResponse.success("Teacher assignment created successfully.", result));
  });

  bulkCreateTeacherAssignments = asyncHandler(async (req: Request, res: Response) => {
    const result = await teacherAssignmentService.bulkCreateTeacherAssignments(req.body);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  updateTeacherAssignment = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await teacherAssignmentService.updateTeacherAssignment(id, req.body);
    res.status(200).json(ApiResponse.success("Teacher assignment updated successfully.", result));
  });

  deleteTeacherAssignment = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await teacherAssignmentService.deleteTeacherAssignment(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  getTeacherAssignmentsByTeacher = asyncHandler(async (req: Request, res: Response) => {
    const teacherId = this.getIdFromParam(req.params.teacherId);
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;

    const result = await teacherAssignmentService.getTeacherAssignmentsByTeacher(teacherId, {
      academicYearId,
      academicTermId,
    });
    res.status(200).json(ApiResponse.success("Teacher assignments retrieved successfully.", result));
  });

  getTeacherAssignmentsByClassroom = asyncHandler(async (req: Request, res: Response) => {
    const classroomId = this.getIdFromParam(req.params.classroomId);
    const result = await teacherAssignmentService.getTeacherAssignmentsByClassroom(classroomId);
    res.status(200).json(ApiResponse.success("Teacher assignments retrieved successfully.", result));
  });

  getMyAssignments = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const academicYearId = typeof req.query.academicYearId === "string" ? req.query.academicYearId : undefined;

    const result = await teacherAssignmentService.getMyAssignments(req.user.id, {
      academicTermId,
      academicYearId,
    });

    res.status(200).json(
      ApiResponse.success("Your assignments retrieved successfully.", result)
    );
  });

  getMyAssignmentsByTerm = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const result = await teacherAssignmentService.getMyAssignments(req.user.id, {
      academicTermId: req.query.academicTermId as string,
      academicYearId: req.query.academicYearId as string,
    });

    res.status(200).json(
      ApiResponse.success("Your assignments by term retrieved successfully.", {
        teacher: result.teacher,
        terms: result.groupedByTerm,
        summary: result.summary,
      })
    );
  });
}

export const teacherAssignmentController = new TeacherAssignmentController();