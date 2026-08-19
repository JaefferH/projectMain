// src/modules/attendance/student/student-attendance.controller.ts
import { Request, Response } from "express";
import { studentAttendanceService } from "./student-attendance.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class StudentAttendanceController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getAttendanceSessions = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const classroomId = typeof req.query.classroomId === "string" ? req.query.classroomId : undefined;
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const isLocked = req.query.isLocked !== undefined ? req.query.isLocked === "true" : undefined;

    const result = await studentAttendanceService.getAttendanceSessions({
      page, limit, classroomId, academicTermId, startDate, endDate, isLocked,
    });

    res.status(200).json(ApiResponse.success("Attendance sessions retrieved successfully.", result));
  });

  getAttendanceSessionById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await studentAttendanceService.getAttendanceSessionById(id);
    res.status(200).json(ApiResponse.success("Attendance session retrieved successfully.", result));
  });

  createAttendanceSession = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await studentAttendanceService.createAttendanceSession(req.user.id, req.body);
    res.status(201).json(ApiResponse.success("Attendance session created successfully.", result));
  });

  updateAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = this.getIdFromParam(req.params.sessionId);
    const recordId = this.getIdFromParam(req.params.recordId);
    const result = await studentAttendanceService.updateAttendanceRecord(sessionId, recordId, req.body);
    res.status(200).json(ApiResponse.success("Attendance record updated successfully.", result));
  });

  lockAttendanceSession = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await studentAttendanceService.lockAttendanceSession(id, req.user.id);
    res.status(200).json(ApiResponse.success("Attendance session locked successfully.", result));
  });

  getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

    const result = await studentAttendanceService.getMyAttendance(req.user.id, {
      academicTermId, startDate, endDate,
    });

    res.status(200).json(ApiResponse.success("Your attendance retrieved successfully.", result));
  });

  getMyAttendanceSessions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
  const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
  const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
  const includeRecords = req.query.includeRecords !== "false"; // Default to true

  const result = await studentAttendanceService.getMyAttendanceSessions(req.user.id, {
    page, limit, academicTermId, startDate, endDate, includeRecords,
  });

  res.status(200).json(ApiResponse.success("Your attendance sessions retrieved successfully.", result));
});

// Homeroom teacher views a specific session
getMyAttendanceSessionById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const id = this.getIdFromParam(req.params.id);
  const result = await studentAttendanceService.getMyAttendanceSessionById(req.user.id, id);
  res.status(200).json(ApiResponse.success("Attendance session retrieved successfully.", result));
});

// Homeroom teacher updates a record in their session
updateMyAttendanceRecord = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const sessionId = this.getIdFromParam(req.params.sessionId);
  const recordId = this.getIdFromParam(req.params.recordId);
  const result = await studentAttendanceService.updateMyAttendanceRecord(
    req.user.id, sessionId, recordId, req.body
  );
  res.status(200).json(ApiResponse.success("Attendance record updated successfully.", result));
});

// Homeroom teacher locks their session
lockMyAttendanceSession = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  const id = this.getIdFromParam(req.params.id);
  const result = await studentAttendanceService.lockMyAttendanceSession(req.user.id, id);
  res.status(200).json(ApiResponse.success("Attendance session locked successfully.", result));
});
}

export const studentAttendanceController = new StudentAttendanceController();