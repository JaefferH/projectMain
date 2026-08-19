// src/modules/announcement/announcement.routes.ts
import { Router } from "express";
import { announcementController } from "./announcement.controller";
import { authenticate, authorize, requireMinRole } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { createAnnouncementSchema, updateAnnouncementSchema } from "./announcement.validation";
import { SYSTEM_ROLES } from "@shared/constants/roles";

const router = Router();
router.use(authenticate);

// User's own announcements
router.get("/my-announcements", announcementController.getMyAnnouncements);
router.patch("/:id/read", announcementController.markAsRead);
router.patch("/read-all", announcementController.markAllAsRead);

// Admin views
router.get("/", authorize("notification:read"), announcementController.getAnnouncements);
router.get("/:id", authorize("notification:read"), announcementController.getAnnouncementById);

// Create & manage
router.post("/", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("notification:create"), validate(createAnnouncementSchema), announcementController.createAnnouncement);
router.patch("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("notification:create"), validate(updateAnnouncementSchema), announcementController.updateAnnouncement);
router.delete("/:id", requireMinRole(SYSTEM_ROLES.ADMIN), authorize("notification:create"), announcementController.deleteAnnouncement);

export default router;