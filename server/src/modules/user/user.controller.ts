// src/modules/user/user.controller.ts
import { Request, Response } from "express";
import { userService } from "./user.service";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiResponse } from "../../shared/responses/ApiResponse";
import { AppError } from "@shared/errors/AppError";
import { TelegramLinkUtils } from "@shared/utils/telegram-link.utils";
import { env } from "process";

class UserController {
  private getIdFromParam = (param: any): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
  };
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
    const roleId = typeof req.query.roleId === "string" ? req.query.roleId : undefined;
    const branchId = typeof req.query.branchId === "string" ? req.query.branchId : undefined;

    const result = await userService.getUsers({
      page,
      limit,
      search,
      isActive,
      roleId,
      branchId,
    });

    res.status(200).json(
      ApiResponse.success("Users retrieved successfully.", result)
    );
  });

  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await userService.getUserById(id);
    res.status(200).json(
      ApiResponse.success("User retrieved successfully.", result)
    );
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const result = await userService.createUser(req.body, req.file);
    res.status(201).json(
      ApiResponse.success("User created successfully.", result)
    );
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await userService.updateUser(
      id,
      req.body,
      req.user // Pass current user for permission checks
    );
    res.status(200).json(
      ApiResponse.success("User updated successfully.", result)
    );
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await userService.deleteUser(
      id,
      req.user
    );
    
    res.status(200).json(
      ApiResponse.success(result.message, result)
    );
  });

  hardDeleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await userService.hardDeleteUser(
      id,
      req.user
    );
    
    res.status(200).json(
      ApiResponse.success(result.message, result)
    );
  });

  restoreUser = asyncHandler(async (req: Request, res: Response) => {
    const id = this.getIdFromParam(req.params.id);
    const result = await userService.restoreUser(
      id,
      req.user
    );
    
    res.status(200).json(
      ApiResponse.success(result.message, result)
    );
  });

  // Bulk operations
  bulkDeleteUsers = asyncHandler(async (req: Request, res: Response) => {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError("Please provide an array of user IDs.", 400);
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const result = await userService.deleteUser(userId, req.user);
        results.push(result);
      } catch (error: any) {
        errors.push({
          userId,
          error: error.message
        });
      }
    }

    res.status(200).json(
      ApiResponse.success("Bulk delete completed.", {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      })
    );
  });

  bulkHardDeleteUsers = asyncHandler(async (req: Request, res: Response) => {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError("Please provide an array of user IDs.", 400);
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        const result = await userService.hardDeleteUser(userId, req.user);
        results.push(result);
      } catch (error: any) {
        errors.push({
          userId,
          error: error.message
        });
      }
    }

    res.status(200).json(
      ApiResponse.success("Bulk hard delete completed.", {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      })
    );
  });

  getUserPermissions = asyncHandler(async (req: Request, res: Response) => {
    const permissions = req.user?.roles?.flatMap(
      (role: any) => role.permissions?.map((p: any) => ({
        id: p.id,
        name: p.name
      })) || []
    ) || [];

    const roles = req.user?.roles?.map((role: any) => ({
      id: role.id,
      name: role.name,
    })) || [];

    res.status(200).json(
      ApiResponse.success("User permissions retrieved successfully.", {
        roles,
        permissions
      })
    );
  });
}

export const userController = new UserController();