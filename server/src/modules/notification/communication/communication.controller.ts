// src/modules/communication/communication.controller.ts
import { Request, Response } from "express";
import { randomBytes } from "crypto";
import { communicationService } from "./communication.service";
import { AppError } from "@shared/errors/AppError";
import { ApiResponse } from "@shared/responses/ApiResponse";
import { asyncHandler } from "@shared/utils/asyncHandler";
import { env } from "@config/env";
import { guardianLinkCodes } from "../gateway/telegram/telegram-bot.service";
import { prisma } from'@config/prisma';

class CommunicationController {
  private getId = (p: any): string => Array.isArray(p) ? p[0] || "" : p || "";

  sendMessageToGuardian = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await communicationService.sendMessageToGuardian(req.user.id, req.body);
    res.status(200).json(ApiResponse.success("Message sent successfully.", result));
  });

  sendBulkMessageToGuardians = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await communicationService.sendBulkMessageToGuardians(req.user.id, req.body);
    res.status(200).json(ApiResponse.success(result.message, result));
  });

  getMessageHistory = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await communicationService.getMessageHistory(
      req.user.id,
      this.getId(req.params.studentId),
      this.getId(req.params.guardianId)
    );
    res.status(200).json(ApiResponse.success("Message history retrieved.", result));
  });

  getStudentGuardians = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);
    const result = await communicationService.getStudentGuardiansForTeacher(
      req.user.id,
      this.getId(req.params.studentId)
    );
    res.status(200).json(ApiResponse.success("Guardians retrieved.", result));
  });

  generateGuardianLinkCode = asyncHandler(async (req: Request, res: Response) => {
  const guardianId = this.getId(req.params.guardianId);
  
  const guardian = await prisma.guardian.findUnique({
    where: { id: guardianId },
    select: { id: true, fullName: true, telegramChatId: true },
  });

  if (!guardian) throw new AppError("Guardian not found.", 404);

  // Check TelegramLink table first (new system)
  const existingTelegramLink = await prisma.telegramLink.findFirst({
    where: { guardianId, linkType: "GUARDIAN", isActive: true },
  });

  if (existingTelegramLink) {
    throw new AppError("Guardian already has Telegram linked.", 400);
  }

  // Also check legacy field
  if (guardian.telegramChatId) {
    throw new AppError("Guardian already has Telegram linked.", 400);
  }

  // Generate code
  const code = `GUA-${randomBytes(4).toString('hex').toUpperCase()}`;
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  guardianLinkCodes.set(code, { guardianId, expiresAt });

  const botUsername = env.telegramBotUsername || 'imamhassenbot';

  res.status(200).json(ApiResponse.success("Guardian link code generated.", {
    guardianId,
    guardianName: guardian.fullName,
    code,
    expiresAt,
    instructions: `Share with guardian: Send /link ${code} to @${botUsername} on Telegram`,
    botLink: `https://t.me/${botUsername}`,
  }));
});
}

export const communicationController = new CommunicationController();