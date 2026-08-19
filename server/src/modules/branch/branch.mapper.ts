// src/modules/branch/branch.mapper.ts
type BranchWithRelations = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  isMainCampus: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  _count?: {
    users: number;
    userProfiles: number;  // Changed from 'profiles' to 'userProfiles'
    classrooms: number;
    subjects: number;
  };
};

export class BranchMapper {
  static toResponse(branch: BranchWithRelations) {
    return {
      id: branch.id,
      organizationId: branch.organizationId,
      name: branch.name,
      code: branch.code,
      phone: branch.phone,
      email: branch.email,
      address: branch.address,
      city: branch.city,
      region: branch.region,
      country: branch.country,
      isMainCampus: branch.isMainCampus,
      isActive: branch.isActive,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
      organization: branch.organization ? {
        id: branch.organization.id,
        name: branch.organization.name,
        code: branch.organization.code,
      } : undefined,
      stats: {
        users: branch._count?.users || 0,
        profiles: branch._count?.userProfiles || 0,  // Map to 'profiles' for API response
        classrooms: branch._count?.classrooms || 0,
        subjects: branch._count?.subjects || 0,
      },
    };
  }

  static toList(branches: BranchWithRelations[]) {
    return branches.map((branch) => this.toResponse(branch));
  }
}