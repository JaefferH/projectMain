// src/modules/organization/organization.mapper.ts
type OrganizationWithRelations = {
  id: string;
  name: string;
  code: string;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  branches?: any[];
  users?: any[];
  _count?: {
    branches: number;
    users: number;
  };
};

export class OrganizationMapper {
  static toResponse(org: OrganizationWithRelations) {
    return {
      id: org.id,
      name: org.name,
      code: org.code,
      logoUrl: org.logoUrl,
      email: org.email,
      phone: org.phone,
      website: org.website,
      address: org.address,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      stats: {
        branches: org._count?.branches || org.branches?.length || 0,
        users: org._count?.users || org.users?.length || 0,
      },
    };
  }

  static toList(orgs: OrganizationWithRelations[]) {
    return orgs.map((org) => this.toResponse(org));
  }

  static toDetail(org: OrganizationWithRelations) {
    return {
      ...this.toResponse(org),
      branches: org.branches?.map((branch: any) => ({
        id: branch.id,
        name: branch.name,
        code: branch.code,
        isMainCampus: branch.isMainCampus,
        isActive: branch.isActive,
      })),
    };
  }
}