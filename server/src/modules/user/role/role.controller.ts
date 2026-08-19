// src/modules/user/role/role.controller.ts
import { Request, Response } from "express";
import { roleService } from "./role.service";
import { asyncHandler } from "../../../shared/utils/asyncHandler";
import { ApiResponse } from "../../../shared/responses/ApiResponse";

class RoleController {
  getRoles = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;

    const result = await roleService.getRoles({ page, limit, search });

    res.status(200).json(
      ApiResponse.success("Roles retrieved successfully.", result)
    );
  });

  getRoleById = asyncHandler(async (req: Request, res: Response) => {
    const roleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await roleService.getRoleById(roleId);
    res.status(200).json(
      ApiResponse.success("Role retrieved successfully.", result)
    );
  });

  createRole = asyncHandler(async (req: Request, res: Response) => {
    const result = await roleService.createRole(req.body);
    res.status(201).json(
      ApiResponse.success("Role created successfully.", result)
    );
  });

  updateRole = asyncHandler(async (req: Request, res: Response) => {
    const roleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await roleService.updateRole(roleId, req.body);
    res.status(200).json(
      ApiResponse.success("Role updated successfully.", result)
    );
  });

  deleteRole = asyncHandler(async (req: Request, res: Response) => {
    const roleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await roleService.deleteRole(roleId);
    res.status(200).json(
      ApiResponse.success(result.message)
    );
  });

  assignPermissionsToRole = asyncHandler(async (req: Request, res: Response) => {
    const { permissionIds } = req.body;
    const roleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await roleService.assignPermissionsToRole(roleId, permissionIds);
    res.status(200).json(
      ApiResponse.success("Permissions assigned to role successfully.", result)
    );
  });

  removePermissionFromRole = asyncHandler(async (req: Request, res: Response) => {
    const roleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const permissionId = Array.isArray(req.params.permissionId) ? req.params.permissionId[0] : req.params.permissionId;
    const result = await roleService.removePermissionFromRole(roleId, permissionId);
    res.status(200).json(
      ApiResponse.success(result.message)
    );
  });

  getRoleUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const roleId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await roleService.getRoleUsers(roleId, { page, limit });
    res.status(200).json(
      ApiResponse.success("Role users retrieved successfully.", result)
    );
  });
}

export const roleController = new RoleController();