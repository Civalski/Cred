/**
 * Define quando a app usa PGlite (Postgres embutido) em vez de DATABASE_URL.
 * Mantenha a mesma lógica em scripts/resolve-pglite.mjs (usado no sync e test-db).
 */
export function pgliteModeFromEnv(): boolean {
  if (process.env.USE_PGLITE === "1") return true;
  if (process.env.USE_PGLITE === "0") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.DATABASE_URL) return false;
  return true;
}
