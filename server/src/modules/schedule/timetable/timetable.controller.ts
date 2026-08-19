// src/modules/schedule/timetable/timetable.controller.ts
import { Request, Response } from "express";
import { timetableService } from "./timetable.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class TimetableController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getTimetableEntries = asyncHandler(async (req: Request, res: Response) => {
    const classroomId = typeof req.query.classroomId === "string" ? req.query.classroomId : undefined;
    const teacherAssignmentId = typeof req.query.teacherAssignmentId === "string" ? req.query.teacherAssignmentId : undefined;
    const schedulePeriodId = typeof req.query.schedulePeriodId === "string" ? req.query.schedulePeriodId : undefined;
    const dayOfWeek = typeof req.query.dayOfWeek === "string" ? req.query.dayOfWeek : undefined;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await timetableService.getTimetableEntries({
      classroomId, teacherAssignmentId, schedulePeriodId, dayOfWeek, branchId, academicTermId, isActive,
    });

    res.status(200).json(ApiResponse.success("Timetable entries retrieved successfully.", result));
  });

  getTimetableEntryById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await timetableService.getTimetableEntryById(id);
    res.status(200).json(ApiResponse.success("Timetable entry retrieved successfully.", result));
  });

  createTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
    const result = await timetableService.createTimetableEntry(req.body);
    res.status(201).json(ApiResponse.success("Timetable entry created successfully.", result));
  });

  bulkCreateTimetable = asyncHandler(async (req: Request, res: Response) => {
    const result = await timetableService.bulkCreateTimetable(req.body);
    res.status(201).json(ApiResponse.success(result.message, result));
  });

  updateTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await timetableService.updateTimetableEntry(id, req.body);
    res.status(200).json(ApiResponse.success("Timetable entry updated successfully.", result));
  });

  deleteTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await timetableService.deleteTimetableEntry(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  // Student views their own timetable
  getMyTimetable = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const result = await timetableService.getMyTimetable(req.user.id, academicTermId);
    res.status(200).json(ApiResponse.success("Your timetable retrieved successfully.", result));
  });

  // Teacher views their own timetable
  getMyTeacherTimetable = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const result = await timetableService.getMyTeacherTimetable(req.user.id, academicTermId);
    res.status(200).json(ApiResponse.success("Your timetable retrieved successfully.", result));
  });
}

export const timetableController = new TimetableController();