// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { authService } from "./auth.service";
import { asyncHandler } from "../../shared/utils/asyncHandler";
import { ApiResponse } from "../../shared/responses/ApiResponse";
import { AppError } from "../../shared/errors/AppError";
import { TelegramLinkUtils } from '@shared/utils/telegram-link.utils';
import { env } from 'process';

class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const result = await authService.login(req.body, ipAddress, userAgent);

    res.status(200).json(
      ApiResponse.success("Login successful", result)
    );
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const result = await authService.me(req.user.id);

    res.status(200).json(
      ApiResponse.success("User profile retrieved successfully", result)
    );
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const result = await authService.updateProfile(req.user.id, req.body, req.file);

    res.status(200).json(
      ApiResponse.success("Profile updated successfully", result)
    );
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json(
      ApiResponse.success("Token refreshed successfully", result)
    );
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    await authService.logout(refreshToken);

    res.status(200).json(
      ApiResponse.success("Logged out successfully")
    );
  });

  logoutAll = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }
    
    await authService.logoutAllSessions(req.user.id);

    res.status(200).json(
      ApiResponse.success("Logged out from all sessions successfully")
    );
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError("User not authenticated", 401);
    }

    const { currentPassword, newPassword } = req.body;
    
    const result = await authService.changePassword(req.user.id, {
      currentPassword,
      newPassword,
    });

    res.status(200).json(
      ApiResponse.success(result.message, null)
    );
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.status(200).json(
      ApiResponse.success(result.message, null)
    );
  });

  resendResetToken = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const result = await authService.resendResetToken(email);

    res.status(200).json(
      ApiResponse.success(result.message, null)
    );
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    const result = await authService.resetPassword(token, newPassword);

    res.status(200).json(
      ApiResponse.success(result.message, null)
    );
  });

  getTelegramLinkCode = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);

    console.log('Generating link code for user:', req.user.id, req.user.username);

    const { code, expiresAt } = await TelegramLinkUtils.generateLinkCode(req.user.id);
    
    const botUsername = env.telegramBotUsername || 'imamhassenbot';
    
    res.status(200).json(ApiResponse.success("Link code generated successfully.", {
      code,
      expiresAt,
      instructions: `Send this command to @${botUsername} on Telegram: /link ${code}`,
      botLink: `https://t.me/${botUsername}`,
    }));
  });
}

export const authController = new AuthController();