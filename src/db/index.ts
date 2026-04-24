import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  postgresClient: ReturnType<typeof postgres> | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!globalForDb.db) {
    globalForDb.postgresClient = postgres(url, { prepare: false, max: 1 });
    globalForDb.db = drizzle(globalForDb.postgresClient, { schema });
  }
  return globalForDb.db;
}
