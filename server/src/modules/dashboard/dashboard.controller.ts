// src/modules/dashboard/dashboard.controller.ts
import { Request, Response } from "express";
import { dashboardService } from "./dashboard.service";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiResponse } from "../../shared/responses/ApiResponse";
import { AppError } from "../../shared/errors/AppError";
import { CacheUtils } from "@shared/utils/cache.utils";

class DashboardController {
  /**
   * Get dashboard data based on user role
   */
  getDashboard = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const userId = req.user.id;
    const cacheKey = CacheUtils.keys.dashboard(userId);

    const result = await CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const userRoles = req.user!.roles?.map(r => r.name) || [];
        
        if (userRoles.includes("SUPER_ADMIN") || userRoles.includes("ADMIN")) {
          return await dashboardService.getAdminDashboard(req.user!);
        } else if (userRoles.includes("TEACHER")) {
          return await dashboardService.getTeacherDashboard(req.user!);
        } else if (userRoles.includes("STUDENT")) {
          return await dashboardService.getStudentDashboard(req.user!);
        }
        throw new AppError("Unknown user role", 403);
      },
      120 
    );

    res.status(200).json(ApiResponse.success("Dashboard retrieved successfully.", result));
  });

  getCalendarEvents = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Not authenticated", 401);
  
  const result = await dashboardService.getCalendarEvents(req.user, {
    month: Number(req.query.month) || undefined,
    year: Number(req.query.year) || undefined,
  });
  
  res.status(200).json(ApiResponse.success("Calendar events retrieved successfully.", result));
});
}

export const dashboardController = new DashboardController();