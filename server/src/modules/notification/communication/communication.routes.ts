// src/modules/communication/communication.routes.ts
import { Router } from "express";
import { communicationController } from "./communication.controller";
import { authenticate } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { sendGuardianMessageSchema, sendBulkGuardianMessageSchema } from "./communication.validation";

const router = Router();
router.use(authenticate);

// Teacher sends message to guardian
router.post("/send-guardian", validate(sendGuardianMessageSchema), communicationController.sendMessageToGuardian);
router.post("/send-bulk", validate(sendBulkGuardianMessageSchema), communicationController.sendBulkMessageToGuardians);

router.post("/guardian/:guardianId/link-code", communicationController.generateGuardianLinkCode);

// Get message history
router.get("/history/:studentId/:guardianId", communicationController.getMessageHistory);

// Get guardians for a student
router.get("/student/:studentId/guardians", communicationController.getStudentGuardians);

export default router;