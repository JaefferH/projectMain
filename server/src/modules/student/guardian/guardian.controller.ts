// src/modules/student/guardian/guardian.controller.ts
import { Request, Response } from "express";
import { guardianService } from "./guardian.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";
import { AppError } from "@shared/errors/AppError";

class GuardianController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };

  getGuardians = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const studentId = typeof req.query.studentId === "string" ? req.query.studentId : undefined;

    const result = await guardianService.getGuardians({
      page, limit, branchId, search, studentId,
    });

    res.status(200).json(ApiResponse.success("Guardians retrieved successfully.", result));
  });

  getGuardianById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await guardianService.getGuardianById(id);
    res.status(200).json(ApiResponse.success("Guardian retrieved successfully.", result));
  });

  getMyGuardians = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const result = await guardianService.getMyGuardians(req.user.id);
    res.status(200).json(
      ApiResponse.success("Your guardians retrieved successfully.", result)
    );
  });

  getGuardiansByMyClasses = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const academicTermId = typeof req.query.academicTermId === "string" ? req.query.academicTermId : undefined;
    const classroomId = typeof req.query.classroomId === "string" ? req.query.classroomId : undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await guardianService.getGuardiansByTeacherClassrooms(req.user.id, {
      academicTermId,
      classroomId,
      search,
    });

    res.status(200).json(
      ApiResponse.success("Students and guardians retrieved successfully.", result)
    );
  });

  createGuardian = asyncHandler(async (req: Request, res: Response) => {
    const result = await guardianService.createGuardian(req.body);
    res.status(201).json(ApiResponse.success("Guardian created successfully.", result));
  });

  updateGuardian = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await guardianService.updateGuardian(id, req.body);
    res.status(200).json(ApiResponse.success("Guardian updated successfully.", result));
  });

  deleteGuardian = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await guardianService.deleteGuardian(id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  linkGuardianToStudent = asyncHandler(async (req: Request, res: Response) => {
    const result = await guardianService.linkGuardianToStudent(req.body);
    res.status(200).json(ApiResponse.success("Guardian linked to student successfully.", result));
  });

  unlinkGuardianFromStudent = asyncHandler(async (req: Request, res: Response) => {
    const guardianId = this.getIdFromParam(req.params.guardianId);
    const studentId = this.getIdFromParam(req.params.studentId);
    const result = await guardianService.unlinkGuardianFromStudent(guardianId, studentId);
    res.status(200).json(ApiResponse.success(result.message));
  });

  getGuardiansByStudent = asyncHandler(async (req: Request, res: Response) => {
    const studentId = this.getIdFromParam(req.params.studentId);
    const result = await guardianService.getGuardiansByStudent(studentId);
    res.status(200).json(ApiResponse.success("Student guardians retrieved successfully.", result));
  });
}

export const guardianController = new GuardianController();