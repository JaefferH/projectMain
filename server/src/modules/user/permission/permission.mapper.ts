// src/modules/user/permission/permission.mapper.ts
type PermissionWithRelations = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  roles?: {
    role: {
      id: string;
      name: string;
    };
  }[];
  _count?: {
    roles: number;
  };
};

export class PermissionMapper {
  static toResponse(permission: PermissionWithRelations) {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
      roles: permission.roles?.map((rp) => ({
        id: rp.role.id,
        name: rp.role.name,
      })) || [],
      stats: {
        roles: permission._count?.roles || permission.roles?.length || 0,
      },
    };
  }

  static toList(permissions: PermissionWithRelations[]) {
    return permissions.map((permission) => this.toResponse(permission));
  }
}