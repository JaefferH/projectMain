import { SystemRole } from "./roles";

// src/shared/constants/permissions.ts
export const PERMISSIONS = {
  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  
  // Role Management
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  
  // Permission Management
  PERMISSION_READ: "permission:read",
  PERMISSION_MANAGE: "permission:manage",
  
  // Organization Management
  ORG_CREATE: "org:create",
  ORG_READ: "org:read",
  ORG_UPDATE: "org:update",
  ORG_DELETE: "org:delete",
  
  // Branch Management
  BRANCH_CREATE: "branch:create",
  BRANCH_READ: "branch:read",
  BRANCH_UPDATE: "branch:update",
  BRANCH_DELETE: "branch:delete",
  
  // Student Management
  STUDENT_CREATE: "student:create",
  STUDENT_READ: "student:read",
  STUDENT_UPDATE: "student:update",
  STUDENT_DELETE: "student:delete",
  
  // Teacher Management
  TEACHER_CREATE: "teacher:create",
  TEACHER_READ: "teacher:read",
  TEACHER_UPDATE: "teacher:update",
  TEACHER_DELETE: "teacher:delete",
  
  // Finance Management
  FINANCE_READ: "finance:read",
  FINANCE_MANAGE: "finance:manage",
  
  // Report Management
  REPORT_READ: "report:read",
  REPORT_CREATE: "report:create",
  
  // Academic Management
  ACADEMIC_READ: "academic:read",
  ACADEMIC_MANAGE: "academic:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Define which permissions each role gets
export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  SUPER_ADMIN: [
    // Super admin gets ALL permissions
    ...Object.values(PERMISSIONS),
  ],
  ADMIN: [
    // Admin gets most permissions except super admin specific ones
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.ROLE_READ,
    PERMISSIONS.PERMISSION_READ,
    PERMISSIONS.BRANCH_CREATE,
    PERMISSIONS.BRANCH_READ,
    PERMISSIONS.BRANCH_UPDATE,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.STUDENT_DELETE,
    PERMISSIONS.TEACHER_CREATE,
    PERMISSIONS.TEACHER_READ,
    PERMISSIONS.TEACHER_UPDATE,
    PERMISSIONS.TEACHER_DELETE,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.ACADEMIC_READ,
    PERMISSIONS.ACADEMIC_MANAGE,
  ],
  TEACHER: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.STUDENT_CREATE,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.STUDENT_UPDATE,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.ACADEMIC_READ,
    PERMISSIONS.ACADEMIC_MANAGE,
  ],
  STUDENT: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.STUDENT_READ,
    PERMISSIONS.REPORT_READ,
    PERMISSIONS.ACADEMIC_READ,
  ],
};