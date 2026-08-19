// src/modules/organization/organization.controller.ts
import { Request, Response } from "express";
import { organizationService } from "./organization.service";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiResponse } from "../../shared/responses/ApiResponse";

class OrganizationController {
  getOrganizations = asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;

    const result = await organizationService.getOrganizations({
      page,
      limit,
      search,
      isActive,
    });

    res.status(200).json(
      ApiResponse.success("Organizations retrieved successfully.", result)
    );
  });

  getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!organizationId) {
      throw new Error("Organization id is required.");
    }
    const result = await organizationService.getOrganizationById(organizationId);
    res.status(200).json(
      ApiResponse.success("Organization retrieved successfully.", result)
    );
  });

  createOrganization = asyncHandler(async (req: Request, res: Response) => {
    const result = await organizationService.createOrganization(req.body);
    res.status(201).json(
      ApiResponse.success("Organization created successfully.", result)
    );
  });

  updateOrganization = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await organizationService.updateOrganization(organizationId, req.body);
    res.status(200).json(
      ApiResponse.success("Organization updated successfully.", result)
    );
  });

  deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await organizationService.deleteOrganization(organizationId);
    res.status(200).json(
      ApiResponse.success(result.message)
    );
  });

  toggleOrganizationStatus = asyncHandler(async (req: Request, res: Response) => {
    const organizationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await organizationService.toggleOrganizationStatus(organizationId);
    res.status(200).json(
      ApiResponse.success("Organization status toggled successfully.", result)
    );
  });
}

export const organizationController = new OrganizationController();