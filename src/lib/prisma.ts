import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
  var pgPoolGlobal: Pool | undefined;
}

export function isDatabaseConfigured(): boolean {
  const dbUrl = process.env.DATABASE_URL;
  return Boolean(dbUrl && dbUrl.trim().length > 0 && !dbUrl.includes("REPLACE_ME"));
}

function createPrismaClient(): PrismaClient {
  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/optitrain_dev?schema=public";

  if (!dbUrl || dbUrl.trim().length === 0) {
    throw new Error(
      "Missing database configuration: DATABASE_URL environment variable is not defined or is empty."
    );
  }

  const pool =
    globalThis.pgPoolGlobal ??
    new Pool({
      connectionString: dbUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalThis.pgPoolGlobal = pool;
  }

  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return client;
}

export const prisma: PrismaClient =
  globalThis.prismaGlobal ??
  (() => {
    try {
      const client = createPrismaClient();
      if (process.env.NODE_ENV !== "production") {
        globalThis.pgPoolGlobal = globalThis.pgPoolGlobal;
        globalThis.prismaGlobal = client;
      }
      return client;
    } catch {
      return new Proxy({} as PrismaClient, {
        get(_, prop) {
          if (prop === "$connect" || prop === "$disconnect") {
            return async () => {};
          }
          throw new Error(
            "Database configuration is missing. Please define DATABASE_URL in your environment."
          );
        },
      });
    }
  })();
