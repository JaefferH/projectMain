import { prisma } from "../src/config/prisma";
import { seedOrganization } from "./seeds/organization.seed";
import { seedUser } from "./seeds/user.seed";

async function main() {
  console.log("Starting database seed...");

  const { organization, branch } = await seedOrganization(prisma);

  await seedUser(
    prisma,
    organization.id,
    branch.id
  );
  console.log(`Organization: ${organization.name}`);
  console.log(`Branch: ${branch.name}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });