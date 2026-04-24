/**
 * Espelha src/lib/postgres-url.ts (getAppPostgresUrl) — altere em conjunto.
 */
export function getPostgresUrlFromEnv() {
  const u =
    process.env.DATABASE_URL?.trim() ||
    process.env.STORAGE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.STORAGE_DATABASE_URL_UNPOOLED?.trim();
  return u || undefined;
}

export function hasPostgresUrlInEnv() {
  return Boolean(getPostgresUrlFromEnv());
}

/**
 * Espelha src/lib/pglite-mode.ts — altere os dois ficheiros em conjunto.
 */
export function pgliteModeFromEnv() {
  if (process.env.USE_PGLITE === "1") return true;
  if (process.env.USE_PGLITE === "0") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (hasPostgresUrlInEnv()) return false;
  return true;
}
