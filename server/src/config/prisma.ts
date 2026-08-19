import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
      transactionOptions: {
        maxWait: 10000,      // 10 seconds max wait
        timeout: 15000,      // 15 seconds timeout
      },
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}