// src/modules/user/user.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../shared/errors/AppError";
import { UserMapper } from "./user.mapper";
import { CreateUserDto, UpdateUserDto } from "./user.validation";
import { hashPassword } from "../../config/bcrypt";
import { ROLE_HIERARCHY, SYSTEM_ROLES } from "@shared/constants/roles";
import { generateSecurePassword } from "../../shared/utils/password.utils";
import { emailService } from "../../shared/services/email.service";
import { CacheUtils } from "../../shared/utils/cache.utils";
import { storageService } from "@shared/services/storage.service";

class UserService {
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
    roleId?: string;
    branchId?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `users:list:${page}:${limit}:${params.search || 'all'}:${params.isActive ?? 'all'}:${params.roleId || 'all'}:${params.branchId || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const where: any = {
          ...(params.isActive !== undefined && { isActive: params.isActive }),
          ...(params.roleId && { role: { some: { roleId: params.roleId } } }),
          ...(params.branchId && { profile: { branchId: params.branchId } }),
          ...(params.search && {
            OR: [
              { username: { contains: params.search, mode: "insensitive" as const } },
              { email: { contains: params.search, mode: "insensitive" as const } },
              { profile: { fullName: { contains: params.search, mode: "insensitive" as const } } },
              { profile: { phone: { contains: params.search, mode: "insensitive" as const } } },
            ],
          }),
        };

        const [users, total] = await prisma.$transaction([
          prisma.user.findMany({
            where, skip, take: limit,
            include: {
              role: {
                include: {
                  role: {
                    include: { permissions: { include: { permission: true } } },
                  },
                },
              },
              profile: {
                include: { branch: { select: { id: true, name: true, code: true } } },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.user.count({ where }),
        ]);

        return {
          items: UserMapper.toList(users),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      120 // 2 minutes - users change more frequently
    );
  }

  async getUserById(userId: string) {
    const cacheKey = CacheUtils.keys.userProfile(userId);
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
            profile: {
              include: { branch: { select: { id: true, name: true, code: true } } },
            },
            organization: { select: { id: true, name: true, code: true } },
          },
        });

        if (!user) throw new AppError("User not found.", 404);
        return UserMapper.toResponse(user);
      },
      300 // 5 minutes
    );
  }

async createUser(data: CreateUserDto, photoFile?: Express.Multer.File) {
  const username = data.username || this.generateUsernameFromEmail(data.email);

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) throw new AppError("Username already exists.", 409);

  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) throw new AppError("Email already exists.", 409);

  const roles = await prisma.role.findMany({ where: { id: { in: data.roleIds } } });
  if (roles.length !== data.roleIds.length) throw new AppError("One or more roles not found.", 404);

  const roleNames = roles.map(r => r.name);
  if (roleNames.includes(SYSTEM_ROLES.SUPER_ADMIN)) throw new AppError("Cannot assign SUPER_ADMIN role.", 403);

  const requiresProfile = roleNames.some(role =>
    [SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.TEACHER, SYSTEM_ROLES.STUDENT].includes(role as any)
  );

  if (requiresProfile && !data.profileData) {
    throw new AppError("Profile data is required for ADMIN, TEACHER, or STUDENT roles.", 400);
  }

  const password = data.password || generateSecurePassword(12);
  const passwordHash = await hashPassword(password);

  // Upload photo OUTSIDE transaction if provided
  let photoUrl = data.profileData?.photoUrl;
  if (photoFile) {
    photoUrl = await storageService.uploadFile(photoFile, 'profile-photos', 'new-user');
  }

  // Minimal transaction - just create user and profile
  const userId = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        organizationId: data.organizationId,
        username,
        email: data.email,
        passwordHash,
        isActive: true,
        role: { create: data.roleIds.map((roleId) => ({ roleId })) },
      },
    });

    if (requiresProfile && data.profileData) {
      await this.createUserProfile(tx, user.id, roleNames, {
        ...data.profileData,
        email: data.email,
        photoUrl: photoUrl || data.profileData.photoUrl,
      });
    }

    return user.id;
  }, {
    timeout: 15000, // 15 second timeout
  });

  // Fetch full user data OUTSIDE transaction
  const fullUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
      profile: { include: { branch: { select: { id: true, name: true, code: true } } } },
    },
  });

  // Send welcome email (outside transaction)
  try {
    await emailService.sendWelcomeEmailWithCredentials(
      data.email, username, password, data.profileData?.fullName || username
    );
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }

  // Invalidate user list cache
  await CacheUtils.invalidatePattern('users:list:*');

  return UserMapper.toResponse(fullUser!);
}

async updateUser(userId: string, data: UpdateUserDto, currentUser?: any) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { role: true } }, profile: true },
  });

  if (!existingUser) throw new AppError("User not found.", 404);

  // Role hierarchy check
  if (currentUser) {
    const currentUserRoles = currentUser.roles?.map((r: any) => r.name) || [];
    const currentUserHighestRole = this.getHighestRole(currentUserRoles);
    const targetUserRoles = existingUser.role.map(r => r.role.name);
    const targetUserHighestRole = this.getHighestRole(targetUserRoles);

    if (currentUserHighestRole !== SYSTEM_ROLES.SUPER_ADMIN) {
      if (ROLE_HIERARCHY[targetUserHighestRole] >= ROLE_HIERARCHY[currentUserHighestRole]) {
        throw new AppError("You don't have permission to modify this user.", 403);
      }
      if (targetUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN)) {
        throw new AppError("Only SUPER_ADMIN can manage SUPER_ADMIN accounts.", 403);
      }
    }
  }

  if (data.username) {
    const exists = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id: userId } },
    });
    if (exists) throw new AppError("Username already exists.", 409);
  }

  if (data.email) {
    const exists = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id: userId } },
    });
    if (exists) throw new AppError("Email already exists.", 409);
  }

  if (data.roleIds) {
    const roles = await prisma.role.findMany({ where: { id: { in: data.roleIds } } });
    if (roles.some(r => r.name === SYSTEM_ROLES.SUPER_ADMIN)) {
      throw new AppError("Cannot assign SUPER_ADMIN role.", 403);
    }
  }

  const updateData: any = {};
  if (data.username) updateData.username = data.username;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.password) {
    updateData.passwordHash = await hashPassword(data.password);
    updateData.passwordChangedAt = new Date();
  }

  // Minimal transaction
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: updateData });

    if (data.roleIds) {
      await tx.userRoleAssignment.deleteMany({ where: { userId } });
      await tx.userRoleAssignment.createMany({
        data: data.roleIds.map((roleId) => ({ userId, roleId })),
      });
    }

    if (data.profileData && existingUser.profile) {
      await tx.userProfile.update({ where: { userId }, data: data.profileData });
    }

    if (data.password) {
      await tx.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, refreshToken: null },
      });
    }
  }, {
    timeout: 15000, // 15 second timeout
  });

  // Fetch full user OUTSIDE transaction
  const fullUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
        },
      },
      profile: { include: { branch: { select: { id: true, name: true, code: true } } } },
    },
  });

  // Invalidate all user-related caches
  await this.invalidateUserCaches(userId);

  return UserMapper.toResponse(fullUser!);
}

  async deleteUser(userId: string, currentUser?: any) {
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { role: true } }, profile: true },
    });

    if (!userToDelete) throw new AppError("User not found.", 404);
    if (!userToDelete.isActive) throw new AppError("User is already deactivated.", 400);

    if (currentUser) {
      const currentUserRoles = currentUser.roles?.map((r: any) => r.name) || [];
      const currentUserHighestRole = this.getHighestRole(currentUserRoles);
      const targetUserRoles = userToDelete.role.map(r => r.role.name);
      const targetUserHighestRole = this.getHighestRole(targetUserRoles);

      if (currentUserHighestRole === SYSTEM_ROLES.SUPER_ADMIN) {
        if (targetUserRoles.includes(SYSTEM_ROLES.SUPER_ADMIN)) {
          throw new AppError("Cannot deactivate SUPER_ADMIN account.", 403);
        }
      } else {
        if (ROLE_HIERARCHY[targetUserHighestRole] >= ROLE_HIERARCHY[currentUserHighestRole]) {
          throw new AppError("You don't have permission to modify this user.", 403);
        }
      }
    }

    if (currentUser && currentUser.id === userId) {
      throw new AppError("You cannot deactivate your own account.", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { isActive: false } });
      await tx.userSession.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, refreshToken: null },
      });
    });

    // Invalidate caches
    await this.invalidateUserCaches(userId);

    return { message: "User deactivated successfully.", userId, action: "deactivated" };
  }

  async hardDeleteUser(userId: string, currentUser?: any) {
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { role: true } }, profile: true },
    });

    if (!userToDelete) throw new AppError("User not found.", 404);

    if (currentUser) {
      const currentUserHighestRole = this.getHighestRole(currentUser.roles || []);
      if (currentUserHighestRole !== SYSTEM_ROLES.SUPER_ADMIN) {
        throw new AppError("Only SUPER_ADMIN can permanently delete users.", 403);
      }
    }

    if (currentUser && currentUser.id === userId) {
      throw new AppError("You cannot delete your own account.", 400);
    }

    const userRoles = userToDelete.role.map(r => r.role.name);
    if (userRoles.includes(SYSTEM_ROLES.SUPER_ADMIN)) {
      throw new AppError("Cannot delete SUPER_ADMIN account.", 403);
    }

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.deleteMany({ where: { userId } });
      await tx.userRoleAssignment.deleteMany({ where: { userId } });
      await tx.userSession.deleteMany({ where: { userId } });
      if (userToDelete.profile) {
        await tx.userProfile.delete({ where: { userId } }).catch(() => {});
      }
      await tx.user.delete({ where: { id: userId } });
    });

    // Invalidate caches
    await this.invalidateUserCaches(userId, true);

    return {
      message: "User permanently deleted successfully.",
      userId,
      action: "permanently_deleted",
      summary: {
        userId: userToDelete.id,
        username: userToDelete.username,
        email: userToDelete.email,
        roles: userRoles,
        hadProfile: !!userToDelete.profile,
      },
    };
  }

  async restoreUser(userId: string, currentUser?: any) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { role: true } }, profile: true },
    });

    if (!user) throw new AppError("User not found.", 404);
    if (user.isActive) throw new AppError("User is already active.", 400);

    if (currentUser) {
      const currentUserRoles = currentUser.roles?.map((r: any) => r.name) || [];
      const currentUserHighestRole = this.getHighestRole(currentUserRoles);
      const targetUserRoles = user.role.map(r => r.role.name);
      const targetUserHighestRole = this.getHighestRole(targetUserRoles);

      if (currentUserHighestRole !== SYSTEM_ROLES.SUPER_ADMIN) {
        if (ROLE_HIERARCHY[targetUserHighestRole] >= ROLE_HIERARCHY[currentUserHighestRole]) {
          throw new AppError("You don't have permission to restore this user.", 403);
        }
      }
    }

    await prisma.user.update({ where: { id: userId }, data: { isActive: true } });

    // Invalidate caches
    await this.invalidateUserCaches(userId);

    return { message: "User restored successfully.", userId, action: "restored" };
  }

  /**
   * Helper to invalidate all user-related caches
   */
  private async invalidateUserCaches(userId: string, isHardDelete: boolean = false) {
    const keysToDelete: string[] = [
      'users:list:*',
      `user:${userId}`,
      `user:${userId}:profile`,
      `user:${userId}:permissions`,
      `user:${userId}:roles`,
      `dashboard:${userId}`,
      `announcements:${userId}`,
      'roles:list:*',
      `role:*:users:*`,
    ];

    if (isHardDelete) {
      keysToDelete.push(`user:${userId}:*`);
    }

    await Promise.all(keysToDelete.map(key =>
      key.endsWith('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }

  private getHighestRole(roles: { name: string }[] | string[]): keyof typeof ROLE_HIERARCHY {
    if (!roles || roles.length === 0) return SYSTEM_ROLES.STUDENT;
    
    const roleNames = typeof roles[0] === 'string'
      ? roles as string[]
      : (roles as { name: string }[]).map(r => r.name);
    
    if (roleNames.includes(SYSTEM_ROLES.SUPER_ADMIN)) return SYSTEM_ROLES.SUPER_ADMIN;
    if (roleNames.includes(SYSTEM_ROLES.ADMIN)) return SYSTEM_ROLES.ADMIN;
    if (roleNames.includes(SYSTEM_ROLES.TEACHER)) return SYSTEM_ROLES.TEACHER;
    return SYSTEM_ROLES.STUDENT;
  }

  private generateUsernameFromEmail(email: string): string {
    let base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 30);
    if (!base || base.length < 3) base = `user${Date.now().toString(36)}`;
    return base;
  }

  private async createUserProfile(tx: any, userId: string, roleNames: string[], profileData: any) {
    const profileBase: any = {
      userId,
      branchId: profileData.branchId,
      fullName: profileData.fullName,
      fathersName: profileData.fathersName,
      mothersName: profileData.mothersName,
      gender: profileData.gender,
      nationalId: profileData.nationalId,
      phone: profileData.phone,
      email: profileData.email,
      address: profileData.address,
      notes: profileData.notes,
      photoUrl: profileData.photoUrl,
      telegramChatId: profileData.telegramChatId,
    };

    if (roleNames.includes(SYSTEM_ROLES.ADMIN) || roleNames.includes(SYSTEM_ROLES.TEACHER)) {
      profileBase.employeeNumber = profileData.employeeNumber ||
        `${roleNames.includes(SYSTEM_ROLES.ADMIN) ? 'ADM' : 'TCH'}-${Date.now()}`;
    }

    if (roleNames.includes(SYSTEM_ROLES.TEACHER)) {
      profileBase.baseSalary = profileData.baseSalary;
      profileBase.hireDate = profileData.hireDate ? new Date(profileData.hireDate) : new Date();
    }

    if (roleNames.includes(SYSTEM_ROLES.STUDENT)) {
      profileBase.registrationNumber = profileData.registrationNumber || `STU-${Date.now()}`;
      profileBase.admissionDate = profileData.admissionDate ? new Date(profileData.admissionDate) : new Date();
    }

    await tx.userProfile.create({ data: profileBase });
  }
}

export const userService = new UserService();