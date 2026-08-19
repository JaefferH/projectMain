// src/modules/user/permission/permission.service.ts
import { prisma } from "@config/prisma";
import { AppError } from "../../../shared/errors/AppError";
import { PermissionMapper } from "./permission.mapper";
import { CreatePermissionDto, UpdatePermissionDto, BulkCreatePermissionDto } from "./permission.validation";
import { CacheUtils } from "../../../shared/utils/cache.utils";

class PermissionService {
  async getPermissions(params: {
    page?: number;
    limit?: number;
    search?: string;
    group?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    
    const cacheKey = `permissions:list:${page}:${limit}:${params.search || 'all'}:${params.group || 'all'}`;
    
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
          ...(params.group && {
            name: { startsWith: params.group },
          }),
        };

        const [permissions, total] = await prisma.$transaction([
          prisma.permission.findMany({
            where, skip, take: limit,
            include: {
              roles: {
                include: {
                  role: { select: { id: true, name: true } },
                },
              },
              _count: { select: { roles: true } },
            },
            orderBy: { name: "asc" },
          }),
          prisma.permission.count({ where }),
        ]);

        const grouped = this.groupPermissionsByModule(PermissionMapper.toList(permissions));

        return {
          items: PermissionMapper.toList(permissions),
          grouped,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
      },
      600 // 10 minutes - permissions rarely change
    );
  }

  async getPermissionById(id: string) {
    const cacheKey = `permission:${id}`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const permission = await prisma.permission.findUnique({
          where: { id },
          include: {
            roles: {
              include: {
                role: { select: { id: true, name: true, description: true } },
              },
            },
            _count: { select: { roles: true } },
          },
        });

        if (!permission) throw new AppError("Permission not found.", 404);
        return PermissionMapper.toResponse(permission);
      },
      600 // 10 minutes
    );
  }

  async getPermissionGroups() {
    const cacheKey = `permissions:groups`;
    
    return CacheUtils.getOrSet(
      cacheKey,
      async () => {
        const permissions = await prisma.permission.findMany({
          select: { name: true },
          orderBy: { name: "asc" },
        });

        const groups = new Set<string>();
        permissions.forEach((p) => {
          const group = p.name.split(":")[0];
          groups.add(group);
        });

        return Array.from(groups).map((group) => ({
          module: group,
          permissions: permissions
            .filter((p) => p.name.startsWith(group))
            .map((p) => p.name),
        }));
      },
      1800 // 30 minutes - permission groups rarely change
    );
  }

  async createPermission(data: CreatePermissionDto) {
    const existingPermission = await prisma.permission.findUnique({
      where: { name: data.name },
    });

    if (existingPermission) {
      throw new AppError("Permission with this name already exists.", 409);
    }

    const permission = await prisma.permission.create({
      data: { name: data.name, description: data.description },
      include: { _count: { select: { roles: true } } },
    });

    // Invalidate all permission caches
    await this.invalidatePermissionCaches();

    return PermissionMapper.toResponse(permission);
  }

  async bulkCreatePermissions(data: BulkCreatePermissionDto) {
    const results = {
      successful: [] as any[],
      failed: [] as { permission: CreatePermissionDto; error: string }[],
    };

    for (const permData of data.permissions) {
      try {
        const existing = await prisma.permission.findUnique({
          where: { name: permData.name },
        });

        if (existing) {
          results.failed.push({
            permission: permData,
            error: `Permission '${permData.name}' already exists`,
          });
          continue;
        }

        const permission = await prisma.permission.create({ data: permData });
        results.successful.push(permission);
      } catch (error: any) {
        results.failed.push({ permission: permData, error: error.message });
      }
    }

    // Invalidate caches if any were created
    if (results.successful.length > 0) {
      await this.invalidatePermissionCaches();
    }

    return {
      message: `Created ${results.successful.length} permissions, ${results.failed.length} failed`,
      ...results,
    };
  }

  async updatePermission(id: string, data: UpdatePermissionDto) {
    const permission = await prisma.permission.findUnique({ where: { id } });
    if (!permission) throw new AppError("Permission not found.", 404);

    if (data.name) {
      const existingPermission = await prisma.permission.findFirst({
        where: { name: data.name, NOT: { id } },
      });
      if (existingPermission) throw new AppError("Permission with this name already exists.", 409);
    }

    const updatedPermission = await prisma.permission.update({
      where: { id },
      data,
      include: {
        roles: {
          include: { role: { select: { id: true, name: true } } },
        },
        _count: { select: { roles: true } },
      },
    });

    // Invalidate caches
    await this.invalidatePermissionCaches(id);

    return PermissionMapper.toResponse(updatedPermission);
  }

  async deletePermission(id: string) {
    const permission = await prisma.permission.findUnique({
      where: { id },
      include: { _count: { select: { roles: true } } },
    });

    if (!permission) throw new AppError("Permission not found.", 404);

    if (permission._count.roles > 0) {
      throw new AppError(
        `Cannot delete permission assigned to ${permission._count.roles} role(s). Remove from roles first.`,
        400
      );
    }

    await prisma.permission.delete({ where: { id } });

    // Invalidate caches
    await this.invalidatePermissionCaches(id);

    return { message: "Permission deleted successfully." };
  }

  /**
   * Helper to invalidate all permission-related caches
   */
  private async invalidatePermissionCaches(permissionId?: string) {
    const keysToDelete: string[] = [
      'permissions:list:*',
      'permissions:groups',
      'roles:list:*',     // Role caches also affected
      'roles:*',           // Individual role caches
    ];

    if (permissionId) {
      keysToDelete.push(`permission:${permissionId}`);
    }

    await Promise.all(keysToDelete.map(key =>
      key.endsWith('*') ? CacheUtils.invalidatePattern(key) : CacheUtils.delete(key)
    ));
  }

  private groupPermissionsByModule(permissions: any[]) {
    const grouped: Record<string, any[]> = {};

    permissions.forEach((permission) => {
      const module = permission.name.split(":")[0];
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permission);
    });

    return Object.entries(grouped).map(([module, perms]) => ({
      module,
      count: perms.length,
      permissions: perms,
    }));
  }
}

export const permissionService = new PermissionService();