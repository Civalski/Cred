import { isRemotePostgresUrlConfigured } from "@/lib/postgres-url";

/**
 * Define quando a app usa PGlite (Postgres embutido) em vez de URL remota.
 * Mantenha a mesma lógica em scripts/resolve-pglite.mjs (usado no sync e test-db).
 */
export function pgliteModeFromEnv(): boolean {
  if (process.env.USE_PGLITE === "1") return true;
  if (process.env.USE_PGLITE === "0") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (isRemotePostgresUrlConfigured()) return false;
  return true;
}
