// src/modules/user/role/role.mapper.ts
type RoleWithRelations = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: {
    permission: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
  users?: {
    user: {
      id: string;
      username: string;
      email: string | null;
      isActive: boolean;
    };
  }[];
  _count?: {
    permissions: number;
    users: number;
  };
};

export class RoleMapper {
  static toResponse(role: RoleWithRelations) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions?.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })) || [],
      stats: {
        permissions: role._count?.permissions || role.permissions?.length || 0,
        users: role._count?.users || role.users?.length || 0,
      },
    };
  }

  static toList(roles: RoleWithRelations[]) {
    return roles.map((role) => this.toResponse(role));
  }

  static toDetail(role: RoleWithRelations) {
    return {
      ...this.toResponse(role),
      users: role.users?.map((ur) => ({
        id: ur.user.id,
        username: ur.user.username,
        email: ur.user.email,
        isActive: ur.user.isActive,
      })) || [],
    };
  }
}