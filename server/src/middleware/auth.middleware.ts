import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from "@config/jwt";
import { AppError } from "@shared/errors/AppError";
import { asyncHandler } from "@shared/utils/asyncHandler";
import { prisma } from "@config/prisma";
import { ROLE_HIERARCHY, SYSTEM_ROLES, SystemRole } from '@shared/constants/roles';
import { CacheUtils } from '@shared/utils/cache.utils';

export const authenticate = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("No token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("No token provided", 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }

    if (!payload.sessionId || !payload.userId) {
      throw new AppError("Invalid token payload", 401);
    }

    // Check if session exists AND is active
    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      throw new AppError("Session not found", 401);
    }

    if (!session.isActive) {
      throw new AppError("Session has been logged out. Please login again.", 401);
    }

    if (session.expiresAt < new Date()) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false, refreshToken: null },
      });
      throw new AppError("Session has expired. Please login again.", 401);
    }

    // Updated query - removed admin, teacher, student relations
    const userId = payload.userId;
    const cacheKey = CacheUtils.keys.userProfile(userId);

    // Cache user with roles and permissions for 5 minutes
    const user = await CacheUtils.getOrSet(
      cacheKey,
      async () => {
        return await prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
            profile: {
              include: {
                branch: { select: { id: true, name: true, code: true } },
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
      },
      300 // 5 minutes
    );

    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (!user.isActive) {
      throw new AppError("Your account has been disabled", 403);
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    // Determine profile type from roles
    const roles = user.role.map(r => r.role.name);
    let profileType: string | null = null;
    
    if (roles.includes(SYSTEM_ROLES.SUPER_ADMIN) || roles.includes(SYSTEM_ROLES.ADMIN)) {
      profileType = "ADMIN";
    } else if (roles.includes(SYSTEM_ROLES.TEACHER)) {
      profileType = "TEACHER";
    } else if (roles.includes(SYSTEM_ROLES.STUDENT)) {
      profileType = "STUDENT";
    }

    // Attach user and session info to request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      organizationId: user.organizationId,
      organization: user.organization || undefined,
      profileId: user.profile?.id || null,
      roles: user.role.map((r: any) => ({
        id: r.role.id,
        name: r.role.name,
        permissions: r.role.permissions?.map((p: any) => ({
          id: p.permission.id,
          name: p.permission.name,
        })) || [],
      })),
      profile: user.profile ? {
        id: user.profile.id,
        fullName: user.profile.fullName,
        email: user.profile.email,
        phone: user.profile.phone,
        photoUrl: user.profile.photoUrl,
        employeeNumber: user.profile.employeeNumber,
        registrationNumber: user.profile.registrationNumber,
        branch: user.profile.branch,
        type: profileType,
      } : null,
      profileType,
      sessionId: session.id,
    };

    next();
  }
);

export const authorize = (...requiredPermissions: string[]) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    // SUPER_ADMIN bypasses all permission checks
    const userRoles = req.user.roles?.map(r => r.name) || [];
    if (userRoles.includes(SYSTEM_ROLES.SUPER_ADMIN)) {
      return next();
    }

    // If no permissions required, allow access
    if (requiredPermissions.length === 0) {
      return next();
    }

    // Get user permissions from roles
    const userPermissions = req.user.roles?.flatMap(
      (role: any) => role.permissions?.map((p: any) => p.name) || []
    ) || [];

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(
      (permission) => userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new AppError("You don't have permission to perform this action", 403);
    }

    next();
  });
};

// Middleware to check minimum role level
export const requireMinRole = (minimumRole: SystemRole) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Not authenticated", 401);
    }

    const userRoles = req.user.roles?.map(r => r.name) || [];
    const highestUserRole = getHighestRole(userRoles);

    if (ROLE_HIERARCHY[highestUserRole] < ROLE_HIERARCHY[minimumRole]) {
      throw new AppError("You don't have sufficient permissions", 403);
    }

    next();
  });
};

function getHighestRole(roles: string[]): SystemRole {
  if (roles.includes(SYSTEM_ROLES.SUPER_ADMIN)) return SYSTEM_ROLES.SUPER_ADMIN;
  if (roles.includes(SYSTEM_ROLES.ADMIN)) return SYSTEM_ROLES.ADMIN;
  if (roles.includes(SYSTEM_ROLES.TEACHER)) return SYSTEM_ROLES.TEACHER;
  return SYSTEM_ROLES.STUDENT;
}