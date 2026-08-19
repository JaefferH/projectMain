// src/modules/auth/auth.service.ts
import { hashPassword, verifyPassword } from "../../config/bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../config/jwt";
import { prisma } from "../../config/prisma";
import { LoginInput } from "./auth.validation";
import { AppError } from "../../shared/errors/AppError";
import { emailService } from "@shared/services/email.service";
import { generateResetToken, hashResetToken } from "@shared/utils/crypto";
import { storageService } from "@shared/services/storage.service";
import { CacheUtils } from "@shared/utils/cache.utils";

export class AuthService {
  async login(data: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { username: data.username },
      include: {
        role: {
          include: { role: true },
        },
        profile: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw AppError.unauthorized("Invalid username or password");
    }

    const passwordValid = await verifyPassword(data.password, user.passwordHash);

    if (!passwordValid) {
      throw AppError.unauthorized("Invalid username or password");
    }

    if (!user.isActive) {
      throw AppError.forbidden("Your account has been disabled.");
    }

    const roles = user.role.map((r) => r.role.name);

    // Create a new session
    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Generate tokens with session ID
    const accessToken = generateAccessToken({
      userId: user.id,
      sessionId: session.id,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Update session with the refresh token
    await prisma.userSession.update({
      where: { id: session.id },
      data: { refreshToken },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Determine profile type
    let profileType: string | null = null;
    if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
      profileType = "ADMIN";
    } else if (roles.includes("TEACHER")) {
      profileType = "TEACHER";
    } else if (roles.includes("STUDENT")) {
      profileType = "STUDENT";
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles,
        profileType,
        profile: user.profile ? {
          id: user.profile.id,
          fullName: user.profile.fullName,
          email: user.profile.email,
          phone: user.profile.phone,
          photoUrl: user.profile.photoUrl,
          employeeNumber: user.profile.employeeNumber,
          registrationNumber: user.profile.registrationNumber,
          branch: user.profile.branch,
        } : null,
      },
      accessToken,
      refreshToken,
    };
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        profile: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const roles = user.role.map((r) => r.role.name);
    let profileType: string | null = null;
    
    if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) {
      profileType = "ADMIN";
    } else if (roles.includes("TEACHER")) {
      profileType = "TEACHER";
    } else if (roles.includes("STUDENT")) {
      profileType = "STUDENT";
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organizationId,
      organization: user.organization,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      roles: user.role.map((r) => ({
        id: r.role.id,
        name: r.role.name,
        permissions: r.role.permissions?.map((p) => ({
          id: p.permission.id,
          name: p.permission.name,
        })) || [],
      })),
      profileType,
      profile: user.profile ? {
        id: user.profile.id,
        fullName: user.profile.fullName,
        fathersName: user.profile.fathersName,
        mothersName: user.profile.mothersName,
        gender: user.profile.gender,           // ✅ ADDED
        nationalId: user.profile.nationalId,
        phone: user.profile.phone,
        email: user.profile.email,
        address: user.profile.address,
        photoUrl: user.profile.photoUrl,
        notes: user.profile.notes,
        telegramChatId: user.profile.telegramChatId,  // ✅ ADDED (was missing)
        employeeNumber: user.profile.employeeNumber,
        registrationNumber: user.profile.registrationNumber,
        baseSalary: user.profile.baseSalary,
        hireDate: user.profile.hireDate,
        admissionDate: user.profile.admissionDate,
        branch: user.profile.branch,
      } : null,
    };
  }

  async updateProfile(userId: string, data: {
    fullName?: string;
    fathersName?: string;
    mothersName?: string | null;
    gender?: string;
    nationalId?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    photoUrl?: string | null;
    notes?: string | null;
  }, photoFile?: Express.Multer.File) {  // ADD optional photo file
    // Check if user has a profile
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw AppError.notFound("Profile not found. Please contact administration.");
    }

    // Handle photo upload if file is provided
    let photoUrl = data.photoUrl;
    if (photoFile) {
      // Delete old photo if exists
      if (existingProfile.photoUrl) {
        await storageService.deleteFile(existingProfile.photoUrl).catch(() => {});
      }
      // Upload new photo
      photoUrl = await storageService.uploadFile(photoFile, 'profile-photos', userId);
    }

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.fathersName !== undefined) updateData.fathersName = data.fathersName;
    if (data.mothersName !== undefined) updateData.mothersName = data.mothersName;
    if (data.gender !== undefined) updateData.gender = data.gender as any;
    if (data.nationalId !== undefined) updateData.nationalId = data.nationalId;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.address !== undefined) updateData.address = data.address;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;

    // Update profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: updateData,
      include: {
        branch: {
          select: { id: true, name: true, code: true },
        },
        user: {
          select: {
            id: true, username: true, email: true,
            role: {
              include: {
                role: {
                  include: {
                    permissions: { include: { permission: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Invalidate user cache
    await CacheUtils.delete(CacheUtils.keys.userProfile(userId));
    await CacheUtils.delete(CacheUtils.keys.user(userId));

    const roles = updatedProfile.user.role.map((r: any) => r.role.name);
    let profileType: string | null = null;
    if (roles.includes("SUPER_ADMIN") || roles.includes("ADMIN")) profileType = "ADMIN";
    else if (roles.includes("TEACHER")) profileType = "TEACHER";
    else if (roles.includes("STUDENT")) profileType = "STUDENT";

    return {
      id: updatedProfile.user.id,
      username: updatedProfile.user.username,
      email: updatedProfile.user.email,
      roles: updatedProfile.user.role.map((r: any) => ({
        id: r.role.id,
        name: r.role.name,
        permissions: r.role.permissions?.map((p: any) => ({ id: p.permission.id, name: p.permission.name })) || [],
      })),
      profileType,
      profile: {
        id: updatedProfile.id,
        fullName: updatedProfile.fullName,
        fathersName: updatedProfile.fathersName,
        mothersName: updatedProfile.mothersName,
        gender: updatedProfile.gender,
        nationalId: updatedProfile.nationalId,
        phone: updatedProfile.phone,
        email: updatedProfile.email,
        address: updatedProfile.address,
        photoUrl: updatedProfile.photoUrl,
        notes: updatedProfile.notes,
        employeeNumber: updatedProfile.employeeNumber,
        registrationNumber: updatedProfile.registrationNumber,
        baseSalary: updatedProfile.baseSalary,
        hireDate: updatedProfile.hireDate,
        admissionDate: updatedProfile.admissionDate,
        telegramChatId: updatedProfile.telegramChatId,
        branch: updatedProfile.branch,
      },
    };
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new AppError("Refresh token is required.", 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (error) {
      throw new AppError("Invalid refresh token.", 401);
    }

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      include: {
        user: {
          include: {
            role: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new AppError("Session not found.", 401);
    }

    if (!session.isActive) {
      throw new AppError("Session has been logged out.", 401);
    }

    if (session.expiresAt < new Date()) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false, refreshToken: null },
      });
      throw new AppError("Session has expired.", 401);
    }

    if (session.refreshToken !== token) {
      // Token reuse detected - invalidate all sessions for this user
      await prisma.userSession.updateMany({
        where: {
          userId: session.userId,
          isActive: true,
        },
        data: {
          isActive: false,
          refreshToken: null,
        },
      });
      throw new AppError("Invalid refresh token.", 401);
    }

    const accessToken = generateAccessToken({
      userId: session.user.id,
      sessionId: session.id,
    });

    const newRefreshToken = generateRefreshToken({
      userId: session.user.id,
      sessionId: session.id,
    });

    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        refreshToken: newRefreshToken,
        lastActivityAt: new Date(),
      },
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new AppError("Refresh token is required.", 400);
    }

    try {
      const payload = verifyRefreshToken(refreshToken);

      const session = await prisma.userSession.findUnique({
        where: { id: payload.sessionId },
      });

      if (!session) {
        return;
      }

      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          isActive: false,
          refreshToken: null,
        },
      });
    } catch (error) {
      return;
    }
  }

  async logoutAllSessions(userId: string) {
    await prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        refreshToken: null,
      },
    });
  }

  async changePassword(userId: string, data: { currentPassword: string; newPassword: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    const isPasswordValid = await verifyPassword(data.currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.badRequest("Current password is incorrect");
    }

    const isSamePassword = await verifyPassword(data.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw AppError.badRequest("New password must be different from current password");
    }

    const newPasswordHash = await hashPassword(data.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        passwordChangedAt: new Date(),
      },
    });

    await prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        refreshToken: null,
      },
    });

    if (user.email) {
      try {
        await emailService.sendPasswordChangedEmail(
          user.email,
          user.profile?.fullName || user.username
        );
      } catch (error) {
        console.error('Failed to send password change notification:', error);
      }
    }

    return { message: "Password changed successfully. Please login again." };
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return {
        message: "If an account with that email exists, we've sent a password reset link.",
      };
    }

    if (!user.isActive) {
      return {
        message: "If an account with that email exists, we've sent a password reset link.",
      };
    }

    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
    });

    await this.createAndSendResetToken(user.id, email, user.profile?.fullName || user.username);

    return {
      message: "If an account with that email exists, we've sent a password reset link.",
    };
  }

  async resendResetToken(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return {
        message: "If an account with that email exists and has a pending reset request, we've sent a new password reset link.",
      };
    }

    if (!user.isActive) {
      return {
        message: "If an account with that email exists and has a pending reset request, we've sent a new password reset link.",
      };
    }

    const existingToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!existingToken) {
      await this.createAndSendResetToken(user.id, email, user.profile?.fullName || user.username);
    } else {
      const cooldownPeriod = 60 * 1000;
      const timeSinceLastRequest = Date.now() - existingToken.createdAt.getTime();

      if (timeSinceLastRequest < cooldownPeriod) {
        const secondsLeft = Math.ceil((cooldownPeriod - timeSinceLastRequest) / 1000);
        throw new AppError(
          `Please wait ${secondsLeft} seconds before requesting another reset token.`,
          429
        );
      }

      await prisma.passwordResetToken.delete({
        where: { id: existingToken.id },
      });

      await this.createAndSendResetToken(user.id, email, user.profile?.fullName || user.username);
    }

    return {
      message: "If an account with that email exists and has a pending reset request, we've sent a new password reset link.",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = hashResetToken(token);

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });

    if (!resetToken) {
      throw AppError.badRequest("Invalid or expired reset token");
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw AppError.badRequest("Reset token has expired");
    }

    if (resetToken.usedAt) {
      throw AppError.badRequest("Reset token has already been used");
    }

    if (!resetToken.user || !resetToken.user.isActive) {
      throw AppError.badRequest("Invalid reset token");
    }

    const isSamePassword = await verifyPassword(newPassword, resetToken.user.passwordHash);
    if (isSamePassword) {
      throw AppError.badRequest("New password must be different from your current password");
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      prisma.userSession.updateMany({
        where: {
          userId: resetToken.userId,
          isActive: true,
        },
        data: {
          isActive: false,
          refreshToken: null,
        },
      }),
    ]);

    if (resetToken.user.email) {
      try {
        await emailService.sendPasswordChangedEmail(
          resetToken.user.email,
          resetToken.user.profile?.fullName || resetToken.user.username
        );
      } catch (error) {
        console.error('Failed to send password change notification:', error);
      }
    }

    return { message: "Password has been reset successfully. Please login with your new password." };
  }

  private async createAndSendResetToken(userId: string, email: string, name?: string) {
    const resetToken = generateResetToken();
    const hashedToken = hashResetToken(resetToken);

    await prisma.passwordResetToken.create({
      data: {
        userId,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      await emailService.sendPasswordResetEmail(email, resetToken, name);
    } catch (error) {
      await prisma.passwordResetToken.delete({
        where: { token: hashedToken },
      });
      throw new AppError("Failed to send password reset email. Please try again.", 500);
    }
  }
}

export const authService = new AuthService();