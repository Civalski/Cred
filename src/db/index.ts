import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import type { PgDatabase } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js/session";
import type { PgliteQueryResultHKT } from "drizzle-orm/pglite/session";
import postgres from "postgres";
import { pgliteModeFromEnv } from "@/lib/pglite-mode";
import { getAppPostgresUrl } from "@/lib/postgres-url";
import * as schema from "./schema";

/** Mesma superfície de API para Neon (postgres-js) e PGlite. */
export type AppDb = PgDatabase<
  PostgresJsQueryResultHKT | PgliteQueryResultHKT,
  typeof schema
>;

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  pgDb: PostgresJsDatabase<typeof schema> | undefined;
  pgliteDbPromise: Promise<AppDb> | undefined;
};

function isPglite() {
  return pgliteModeFromEnv();
}

export async function getDb(): Promise<AppDb> {
  if (isPglite()) {
    if (!globalForDb.pgliteDbPromise) {
      globalForDb.pgliteDbPromise = (async () => {
        const { drizzle } = await import("drizzle-orm/pglite");
        const path = await import("node:path");
        const dir = process.env.PGLITE_DATA_DIR ?? ".pglite-data";
        const dataDir = path.resolve(process.cwd(), dir.replace(/^file:/, ""));
        const db = drizzle({ connection: { dataDir }, schema });
        await db.$client.waitReady;
        return db as AppDb;
      })();
    }
    return globalForDb.pgliteDbPromise;
  }

  const url = getAppPostgresUrl();
  if (!url) {
    throw new Error(
      "No Postgres URL: set DATABASE_URL (or Vercel Neon STORAGE_DATABASE_URL), or in development omit DATABASE_URL to use embedded PGlite.",
    );
  }
  if (!globalForDb.pgDb) {
    globalForDb.postgresClient = postgres(url, { prepare: false, max: 1 });
    globalForDb.pgDb = drizzlePg(globalForDb.postgresClient, { schema });
  }
  return globalForDb.pgDb as AppDb;
}
