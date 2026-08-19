// src/modules/branch/branch.controller.ts
import { Request, Response } from "express";
import { branchService } from "./branch.service";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiResponse } from "../../shared/responses/ApiResponse";
import { AppError } from "@shared/errors/AppError";

class BranchController {
  getBranches = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    const organizationId = typeof req.query.organizationId === "string" ? req.query.organizationId : undefined;
    const city = typeof req.query.city === "string" ? req.query.city : undefined;

    const result = await branchService.getBranches({
      page,
      limit,
      search,
      isActive,
      organizationId,
      city,
    });

    res.status(200).json(
      ApiResponse.success("Branches retrieved successfully.", result)
    );
  });

  getBranchById = asyncHandler(async (req: Request, res: Response) => {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await branchService.getBranchById(branchId);
    res.status(200).json(
      ApiResponse.success("Branch retrieved successfully.", result)
    );
  });

  createBranch = asyncHandler(async (req: Request, res: Response) => {
    const result = await branchService.createBranch(req.body);
    res.status(201).json(
      ApiResponse.success("Branch created successfully.", result)
    );
  });

  updateBranch = asyncHandler(async (req: Request, res: Response) => {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await branchService.updateBranch(branchId, req.body);
    res.status(200).json(
      ApiResponse.success("Branch updated successfully.", result)
    );
  });

  deleteBranch = asyncHandler(async (req: Request, res: Response) => {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const reassignToBranchId = req.body?.reassignToBranchId;

    // If reassignToBranchId is provided, reassign and delete
    if (reassignToBranchId) {
      const result = await branchService.deleteBranchWithReassign(
        branchId,
        reassignToBranchId,
        req.user
      );
      return res.status(200).json(
        ApiResponse.success(result.message, result)
      );
    }

    // Regular delete (will fail if branch has related records)
    const result = await branchService.deleteBranch(branchId);
    res.status(200).json(
      ApiResponse.success(result.message, result)
    );
  });

  softDeleteBranch = asyncHandler(async (req: Request, res: Response) => {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await branchService.softDeleteBranch(branchId);
    res.status(200).json(
      ApiResponse.success("Branch deactivated successfully.", result)
    );
  });

  deleteBranchWithReassign = asyncHandler(async (req: Request, res: Response) => {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { reassignToBranchId } = req.body;
    
    if (!reassignToBranchId) {
      throw new AppError("Target branch ID for reassignment is required.", 400);
    }

    const result = await branchService.deleteBranchWithReassign(
      branchId,
      reassignToBranchId,
      req.user
    );
    
    res.status(200).json(
      ApiResponse.success(result.message, result)
    );
  });

  toggleBranchStatus = asyncHandler(async (req: Request, res: Response) => {
    const branchId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await branchService.toggleBranchStatus(branchId);
    res.status(200).json(
      ApiResponse.success("Branch status toggled successfully.", result)
    );
  });

  getBranchesByOrganization = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = Array.isArray(req.params.organizationId)
      ? req.params.organizationId[0]
      : req.params.organizationId;

    const result = await branchService.getBranchesByOrganization(organizationId);
    res.status(200).json(
      ApiResponse.success("Organization branches retrieved successfully.", result)
    );
  });
}

export const branchController = new BranchController();