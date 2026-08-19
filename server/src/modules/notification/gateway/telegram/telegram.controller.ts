// src/modules/notification/gateway/telegram/telegram.controller.ts
import { Request, Response } from "express";
import { asyncHandler } from "../../../../shared/utils/asyncHandler";
import { telegramService } from "@shared/services/telegram.service";
import { telegramBotService } from "./telegram-bot.service";

class TelegramController {
  /**
   * Webhook endpoint for Telegram
   * Set this URL in BotFather: https://your-domain.com/api/telegram/webhook
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const update = req.body;
    console.log('Telegram webhook received:', JSON.stringify(update).substring(0, 200));

    // Process the update
    await telegramBotService.processUpdate(update);

    // Always respond 200 to Telegram
    res.status(200).json({ ok: true });
  });

  /**
   * Setup webhook manually (or call this once to configure)
   */
  setupWebhook = asyncHandler(async (req: Request, res: Response) => {
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/telegram/webhook`;
    await telegramService.setWebhook(webhookUrl);
    res.status(200).json({ message: `Webhook set to: ${webhookUrl}` });
  });
}

export const telegramController = new TelegramController();