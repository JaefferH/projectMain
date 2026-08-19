// src/modules/user/user.mapper.ts
type UserWithRelations = {
  id: string;
  username: string;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  organizationId: string;

  role?: {
    role: {
      id: string;
      name: string;
      description?: string | null;
      permissions?: {
        permission: {
          id: string;
          name: string;
        };
      }[];
    };
  }[];

  profile?: {
    id: string;
    fullName: string;
    fathersName: string;
    mothersName: string | null;
    gender: string | null;
    nationalId: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    photoUrl: string | null;
    notes: string | null;
    telegramChatId: string | null;
    employeeNumber: string | null;
    registrationNumber: string | null;
    baseSalary: any;
    hireDate: Date | null;
    admissionDate: Date | null;
    isActive: boolean;
    branchId: string;
    branch?: {
      id: string;
      name: string;
      code: string;
    };
  };
};

export class UserMapper {
  static toResponse(user: UserWithRelations) {
    let profileType: string | null = null;
    let profile: any = null;

    if (user.profile) {
      const roleNames = user.role?.map(r => r.role.name) || [];
      
      if (roleNames.includes("SUPER_ADMIN") || roleNames.includes("ADMIN")) {
        profileType = "ADMIN";
      } else if (roleNames.includes("TEACHER")) {
        profileType = "TEACHER";
      } else if (roleNames.includes("STUDENT")) {
        profileType = "STUDENT";
      }

      profile = {
        id: user.profile.id,
        fullName: user.profile.fullName,
        fathersName: user.profile.fathersName,
        mothersName: user.profile.mothersName,
        gender: user.profile.gender, // ADD THIS
        nationalId: user.profile.nationalId,
        phone: user.profile.phone,
        email: user.profile.email,
        address: user.profile.address,
        photoUrl: user.profile.photoUrl,
        notes: user.profile.notes,
        telegramChatId: user.profile.telegramChatId,
        employeeNumber: user.profile.employeeNumber,
        registrationNumber: user.profile.registrationNumber,
        baseSalary: user.profile.baseSalary,
        hireDate: user.profile.hireDate,
        admissionDate: user.profile.admissionDate,
        branchId: user.profile.branchId,
        branch: user.profile.branch || null,
      };
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      createdAt: user.createdAt,
      organizationId: user.organizationId,
      roles: user.role?.map((r) => ({
        id: r.role.id,
        name: r.role.name,
        permissions: r.role.permissions?.map((p) => ({
          id: p.permission.id,
          name: p.permission.name,
        })) ?? [],
      })) ?? [],
      profileType,
      profile,
    };
  }

  static toList(users: UserWithRelations[]) {
    return users.map((user) => this.toResponse(user));
  }
}