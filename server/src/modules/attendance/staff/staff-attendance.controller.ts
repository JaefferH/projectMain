// src/modules/attendance/staff/staff-attendance.controller.ts
import { Request, Response } from "express";
import { staffAttendanceService } from "./staff-attendance.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "../../../shared/errors/AppError";

class StaffAttendanceController {
  getStaffAttendance = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const result = await staffAttendanceService.getStaffAttendance({
      page, limit, branchId, startDate, endDate, status,
    });

    res.status(200).json(ApiResponse.success("Staff attendance retrieved successfully.", result));
  });

  checkIn = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await staffAttendanceService.checkIn(req.user.id, req.body);
    res.status(201).json(ApiResponse.success("Check-in recorded successfully.", result));
  });

  checkOut = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const attendanceDate = req.body.attendanceDate as string;
    if (!attendanceDate) throw new AppError("attendanceDate is required", 400);
    const result = await staffAttendanceService.checkOut(req.user.id, attendanceDate);
    res.status(200).json(ApiResponse.success("Check-out recorded successfully.", result));
  });

  getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;

    const result = await staffAttendanceService.getMyAttendance(req.user.id, {
      startDate, endDate,
    });

    res.status(200).json(ApiResponse.success("Your attendance retrieved successfully.", result));
  });

  updateStaffAttendance = asyncHandler(async (req: Request, res: Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await staffAttendanceService.updateStaffAttendance(id, req.body);
    res.status(200).json(ApiResponse.success("Staff attendance updated successfully.", result));
  });
}

export const staffAttendanceController = new StaffAttendanceController();