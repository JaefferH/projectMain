// src/modules/assessment/report-card/report-card.routes.ts
import { Router } from "express";
import { reportCardController } from "./report-card.controller";
import { authenticate, authorize } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { finalizeReportCardSchema } from "./report-card.validation";

const router = Router();
router.use(authenticate);

// Student views own report card
router.get("/my-report-card", reportCardController.getMyReportCard);

// Homeroom teacher views class report cards
router.get("/class-report-cards", reportCardController.getClassReportCards);

// Get specific report card by enrollment
router.get("/enrollment/:enrollmentId", authorize("academic:read"), reportCardController.getReportCardByEnrollment);

router.get(
  "/student/:enrollmentId",
  reportCardController.getStudentReportCard
);

// Regenerate report card (recalculates all grades)
router.post(
  "/enrollment/:enrollmentId/regenerate",
  reportCardController.regenerateReportCard
);

// Homeroom teacher finalizes (service checks homeroom teacher ownership)
router.patch("/:id/finalize", validate(finalizeReportCardSchema), reportCardController.finalizeReportCard);

export default router;