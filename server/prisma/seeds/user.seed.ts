import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../../src/config/bcrypt";

const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

export async function seedUser(
  prisma: PrismaClient,
  organizationId: string,
  branchId: string
) {
  // Create Super Admin Role
  const role = await prisma.role.upsert({
    where: {
      name: SUPER_ADMIN_ROLE,
    },
    update: {},
    create: {
      name: SUPER_ADMIN_ROLE,
      description: "System Super Administrator",
    },
  });

  // Hash Password
  const passwordHash = await hashPassword("Admin@123");

  // Create User
  const user = await prisma.user.upsert({
    where: {
      username: "admin",
    },
    update: {},
    create: {
      organizationId,
      username: "admin",
      email: "admin@madrassa.local",
      passwordHash,
      isActive: true,
    },
  });

  // Assign Role
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: user.id,
        roleId: role.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      roleId: role.id,
    },
  });

  // Create Admin Profile
  await prisma.userProfile.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
      branchId,
      employeeNumber: "ADM-001",
      fullName: "System Administrator",
      fathersName: "Administrator",
      email: "admin@madrassa.local",
      phone: "+251900000000",
    },
  });

  return {
    role,
    user,
  };
}
