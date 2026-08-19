// src/modules/user/permission/permission.controller.ts
import { Request, Response } from "express";
import { permissionService } from "./permission.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class PermissionController {
  getPermissions = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const group = typeof req.query.group === "string" ? req.query.group : undefined;

    const result = await permissionService.getPermissions({ page, limit, search, group });

    res.status(200).json(
      ApiResponse.success("Permissions retrieved successfully.", result)
    );
  });

  getPermissionById = asyncHandler(async (req: Request, res: Response) => {
    const permissionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await permissionService.getPermissionById(permissionId);
    res.status(200).json(
      ApiResponse.success("Permission retrieved successfully.", result)
    );
  });

  createPermission = asyncHandler(async (req: Request, res: Response) => {
    const result = await permissionService.createPermission(req.body);
    res.status(201).json(
      ApiResponse.success("Permission created successfully.", result)
    );
  });

  bulkCreatePermissions = asyncHandler(async (req: Request, res: Response) => {
    const result = await permissionService.bulkCreatePermissions(req.body);
    res.status(201).json(
      ApiResponse.success(result.message, result)
    );
  });

  updatePermission = asyncHandler(async (req: Request, res: Response) => {
    const permissionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await permissionService.updatePermission(permissionId, req.body);
    res.status(200).json(
      ApiResponse.success("Permission updated successfully.", result)
    );
  });

  deletePermission = asyncHandler(async (req: Request, res: Response) => {
    const permissionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await permissionService.deletePermission(permissionId);
    res.status(200).json(
      ApiResponse.success(result.message)
    );
  });

  getPermissionGroups = asyncHandler(async (req: Request, res: Response) => {
    const result = await permissionService.getPermissionGroups();
    res.status(200).json(
      ApiResponse.success("Permission groups retrieved successfully.", result)
    );
  });
}

export const permissionController = new PermissionController();