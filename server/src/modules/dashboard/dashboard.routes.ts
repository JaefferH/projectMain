// src/modules/dashboard/dashboard.routes.ts
import { Router } from "express";
import { dashboardController } from "./dashboard.controller";
import { authenticate } from "@middleware/auth.middleware";

const router = Router();
router.use(authenticate);

// Single endpoint that returns role-specific dashboard data
router.get("/", dashboardController.getDashboard);
router.get("/calendar", dashboardController.getCalendarEvents);


export default router;