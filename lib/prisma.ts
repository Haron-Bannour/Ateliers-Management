import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prisma 7 utilise un driver adapter au lieu d'une connexion directe.
// PrismaNeon optimise les connexions vers Neon (PostgreSQL serverless).
function creerClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

// Pattern singleton : évite les fuites de connexions lors des hot-reloads Next.js
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? creerClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
