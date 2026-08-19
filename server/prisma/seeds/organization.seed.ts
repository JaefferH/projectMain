import { prisma } from "../../src/config/prisma";
import {
  DEFAULT_BRANCH,
  DEFAULT_ORGANIZATION,
} from "../../src/shared/constants/seed";
import { PrismaClient } from '@prisma/client';

export async function seedOrganization(prisma: PrismaClient) {
  const organization = await prisma.organization.upsert({
    where: {
      code: DEFAULT_ORGANIZATION.code,
    },
    update: {},
    create: {
      name: DEFAULT_ORGANIZATION.name,
      code: DEFAULT_ORGANIZATION.code,
    },
  });

  const branch = await prisma.branch.upsert({
    where: {
      organizationId_code: {
        organizationId: organization.id,
        code: DEFAULT_BRANCH.code,
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      name: DEFAULT_BRANCH.name,
      code: DEFAULT_BRANCH.code,
      isMainCampus: true,
    },
  });

  return {
    organization,
    branch,
  };
}