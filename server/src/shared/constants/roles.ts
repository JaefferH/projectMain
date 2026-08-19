// src/shared/constants/roles.ts
export const SYSTEM_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TEACHER: "TEACHER",
  STUDENT: "STUDENT",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

export const ROLE_HIERARCHY: Record<SystemRole, number> = {
  SUPER_ADMIN: 4,
  ADMIN: 3,
  TEACHER: 2,
  STUDENT: 1,
};

export const ROLE_DESCRIPTIONS: Record<SystemRole, string> = {
  SUPER_ADMIN: "Super Administrator - Full system access across all organizations",
  ADMIN: "Administrator - Full access within their organization",
  TEACHER: "Teacher - Can manage students, grades, and view reports",
  STUDENT: "Student - Can view their own information and grades",
};