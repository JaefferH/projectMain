// src/modules/user/role/role.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { RoleMapper } from "./role.mapper";
import { CreateRoleDto, UpdateRoleDto } from "./role.validation";
import { SYSTEM_ROLES } from "../../../shared/constants/roles";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class RoleService {
  async getRoles(params: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `roles:list:${page}:${limit}:${params.search || 'all'}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;

        const where: any = {
          ...(params.search && {
            OR: [
              { name: { contains: params.search, mode: "insensitive" as const } },
              { description: { contains: params.search, mode: "insensitive" as const } },
            ],
          }),
        };

        const [roles, total] = await prisma.$transaction([
          prisma.role.findMany({
            where, skip, take: limit,
            include: {
              permissions: { include: { permission: true } },
              _count: { select: { permissions: true, users: true } },
            },
            orderBy: { createdAt: "asc" },
          }),
          prisma.role.count({ where }),
        ]);

        return {
          items: RoleMapper.toList(roles),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      600 // 10 minutes - roles rarely change
    );
  }

  async getRoleById(id: string) {
    const cacheKey = `role:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const role = await prisma.role.findUnique({
          where: { id },
          include: {
            permissions: { include: { permission: true } },
            users: {
              include: {
                user: { select: { id: true, username: true, email: true, isActive: true } },
              },
              take: 10,
            },
            _count: { select: { permissions: true, users: true } },
          },
        });

        if (!role) throw new AppError("Role not found.", 404);
        return RoleMapper.toDetail(role);
      },
      600 // 10 minutes
    );
  }

  async getRoleUsers(roleId: string, params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    
    const cacheKey = `role:${roleId}:users:${page}:${limit}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const role = await prisma.role.findUnique({ where: { id: roleId } });
        if (!role) throw new AppError("Role not found.", 404);

        const skip = (page - 1) * limit;
        const [userRoles, total] = await prisma.$transaction([
          prisma.userRoleAssignment.findMany({
            where: { roleId }, skip, take: limit,
            include: {
              user: { select: { id: true, username: true, email: true, isActive: true, createdAt: true } },
            },
            orderBy: { assignedAt: "desc" },
          }),
          prisma.userRoleAssignment.count({ where: { roleId } }),
        ]);

        return {
          role: { id: role.id, name: role.name },
          users: userRoles.map((ur) => ({
            id: ur.user.id,
            username: ur.user.username,
            email: ur.user.email,
            isActive: ur.user.isActive,
            assignedAt: ur.assignedAt,
          })),
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      300 // 5 minutes
    );
  }

  async createRole(data: CreateRoleDto) {
    const existingRole = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existingRole) throw new AppError("Role with this name already exists.", 409);

    if (data.permissionIds && data.permissionIds.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { id: { in: data.permissionIds } },
      });
      if (permissions.length !== data.permissionIds.length) {
        throw new AppError("One or more permissions not found.", 404);
      }
    }

    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        ...(data.permissionIds && {
          permissions: {
            create: data.permissionIds.map((permissionId) => ({ permissionId })),
          },
        }),
      },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { permissions: true, users: true } },
      },
    });

    // Invalidate role list cache
    await CacheUtils.invalidatePattern('roles:list:*');

    return RoleMapper.toResponse(role);
  }

  async updateRole(id: string, data: UpdateRoleDto) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { users: true },
    });
    if (!role) throw new AppError("Role not found.", 404);

    // Prevent modifying system roles names
    const systemRoles = Object.values(SYSTEM_ROLES);
    if (systemRoles.includes(role.name as any) && data.name && data.name !== role.name) {
      throw new AppError("Cannot rename system roles.", 403);
    }

    if (data.name) {
      const existingRole = await prisma.role.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existingRole) throw new AppError("Role with this name already exists.", 409);
    }

    if (data.permissionIds && data.permissionIds.length > 0) {
      const permissions = await prisma.permission.findMany({
        where: { id: { in: data.permissionIds } },
      });
      if (permissions.length !== data.permissionIds.length) {
        throw new AppError("One or more permissions not found.", 404);
      }
    }

    const updatedRole = await prisma.$transaction(async (tx) => {
      const updated = await tx.role.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
        },
      });

      if (data.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (data.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
          });
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { permissions: true, users: true } },
        },
      });
    });

    // Invalidate caches
    await this.invalidateRoleCaches(id);

    return RoleMapper.toResponse(updatedRole!);
  }

  async deleteRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: { users: true, _count: { select: { users: true } } },
    });
    if (!role) throw new AppError("Role not found.", 404);

    const systemRoles = Object.values(SYSTEM_ROLES);
    if (systemRoles.includes(role.name as any)) {
      throw new AppError(`Cannot delete system role: ${role.name}`, 403);
    }

    if (role._count.users > 0) {
      throw new AppError(
        `Cannot delete role with ${role._count.users} assigned user(s). Reassign users first.`,
        400
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      await tx.role.delete({ where: { id } });
    });

    // Invalidate caches
    await this.invalidateRoleCaches(id);

    return { message: "Role deleted successfully." };
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw new AppError("Role not found.", 404);

    const permissions = await prisma.permission.findMany({
      where: { id: { in: permissionIds } },
    });
    if (permissions.length !== permissionIds.length) {
      throw new AppError("One or more permissions not found.", 404);
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    });

    // Invalidate caches
    await this.invalidateRoleCaches(roleId);

    return this.getRoleById(roleId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const rolePermission = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } },
    });
    if (!rolePermission) throw new AppError("Permission not assigned to this role.", 404);

    await prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } },
    });

    // Invalidate caches
    await this.invalidateRoleCaches(roleId);

    return { message: "Permission removed from role successfully." };
  }

  /**
   * Helper to invalidate all role-related caches
   */
  private async invalidateRoleCaches(roleId?: string) {
    const keysToDelete: string[] = [
      'roles:list:*',
      'permissions:list:*',   // Role changes can affect permission views
      'permissions:groups',
    ];

    if (roleId) {
      keysToDelete.push(`role:${roleId}`);
      keysToDelete.push(`role:${roleId}:users:*`);
    }

    // Also invalidate user caches since role assignments changed
    keysToDelete.push('user:*');

    await Promise.all(keysToDelete.map(key =>
      key.endsWith('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }
}

export const roleService = new RoleService();