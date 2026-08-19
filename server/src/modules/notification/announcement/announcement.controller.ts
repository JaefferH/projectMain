// src/modules/announcement/announcement.controller.ts
import { Request, Response } from "express";
import { announcementService } from "./announcement.service";
import { AppError } from "@shared/errors/AppError";
import { ApiResponse } from "@shared/responses/ApiResponse";
import { asyncHandler } from "@shared/utils/asyncHandler";

class AnnouncementController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  getAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    const result = await announcementService.getAnnouncements({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      branchId: req.query.branchId as string,
      type: req.query.type as string,
      priority: req.query.priority as string,
      isPublished: req.query.isPublished !== undefined ? req.query.isPublished === "true" : undefined,
      targetAudience: req.query.targetAudience as string,
    });
    res.status(200).json(ApiResponse.success("Announcements retrieved successfully.", result));
  });

  getAnnouncementById = asyncHandler(async (req: Request, res: Response) => {
    const result = await announcementService.getAnnouncementById(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success("Announcement retrieved successfully.", result));
  });

  getMyAnnouncements = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await announcementService.getMyAnnouncements(req.user.id);
    res.status(200).json(ApiResponse.success("Your announcements retrieved successfully.", result));
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await announcementService.markAsRead(this.getId(req.params.id), req.user.id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await announcementService.markAllAsRead(req.user.id);
    res.status(200).json(ApiResponse.success(result.message));
  });

  createAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await announcementService.createAnnouncement(req.body, req.user.id);
    res.status(201).json(ApiResponse.success("Announcement created successfully.", result));
  });

  updateAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const result = await announcementService.updateAnnouncement(this.getId(req.params.id), req.body);
    res.status(200).json(ApiResponse.success("Announcement updated successfully.", result));
  });

  deleteAnnouncement = asyncHandler(async (req: Request, res: Response) => {
    const result = await announcementService.deleteAnnouncement(this.getId(req.params.id));
    res.status(200).json(ApiResponse.success(result.message));
  });
}

export const announcementController = new AnnouncementController();