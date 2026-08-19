import { Router } from "express";
import { telegramController } from "./telegram.controller";

const router = Router();

// Webhook endpoint (called by Telegram)
router.post("/webhook", telegramController.handleWebhook);

// Setup webhook (call once to configure)
router.post("/setup-webhook", telegramController.setupWebhook);

export default router;