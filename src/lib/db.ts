import { PrismaClient } from "@prisma/client";

// Standard Next.js dev-mode singleton to avoid exhausting SQLite connections
// on hot reload. Swapping the datasource (see prisma/schema.prisma) to
// PostgreSQL in production requires no change here.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
