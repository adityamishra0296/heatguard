import path from "node:path";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Resolve the datasource URL.
 *
 * For SQLite (development) the URL is a relative `file:` path. The Prisma CLI
 * resolves it against the schema directory (`prisma/`), but once the client is
 * bundled (e.g. by Turbopack) that relative base is lost and the file cannot be
 * opened. We therefore resolve relative `file:` paths to an absolute path under
 * `prisma/` so the CLI and the runtime client always target the same file.
 */
function resolveDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw || !raw.startsWith("file:")) return raw;

  const filePath = raw.slice("file:".length).replace(/^\.\//, "");
  if (path.isAbsolute(filePath)) return raw;

  return `file:${path.resolve(process.cwd(), "prisma", filePath)}`;
}

/**
 * Prisma client singleton.
 *
 * In development, Next.js hot-reloading would otherwise create a new client on
 * every reload and exhaust database connections, so we cache the instance on
 * `globalThis`.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const datasourceUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
