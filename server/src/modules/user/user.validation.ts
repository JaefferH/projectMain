// src/modules/user/user.validation.ts
import { z } from "zod";

// Base profile schema for all user types
const baseProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  fathersName: z.string().min(1, "Father's name is required"),
  mothersName: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
  telegramChatId: z.string().optional(),
  branchId: z.string().cuid("Invalid branch ID"),
});

export const createUserSchema = z.object({
  organizationId: z.string().cuid("Invalid organization ID"),
  // Username is now OPTIONAL - will be auto-generated from email
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
    .optional(),
  email: z.string().email("Invalid email format"),
  // Password is now optional - will be auto-generated if not provided
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .optional(),
  roleIds: z.array(z.string().cuid("Invalid role ID")).min(1, "At least one role is required"),
  // Profile data - email field REMOVED from here (uses user email)
  profileData: baseProfileSchema.extend({
    // Admin/Teacher specific
    employeeNumber: z.string().optional(),
    // Teacher specific
    baseSalary: z.number().positive().optional(),
    hireDate: z.string().datetime().optional(),
    // Student specific
    registrationNumber: z.string().optional(),
    admissionDate: z.string().datetime().optional(),
  }).optional(),
});

export const updateUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
  roleIds: z.array(z.string().cuid()).min(1).optional(),
  password: z
    .string()
    .min(8)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .optional(),
  profileData: baseProfileSchema.extend({
    employeeNumber: z.string().optional(),
    baseSalary: z.number().positive().optional(),
    hireDate: z.string().datetime().optional(),
    registrationNumber: z.string().optional(),
    admissionDate: z.string().datetime().optional(),
  }).partial().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;