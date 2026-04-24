/**
 * Espelha src/lib/pglite-mode.ts — altere os dois ficheiros em conjunto.
 */
export function pgliteModeFromEnv() {
  if (process.env.USE_PGLITE === "1") return true;
  if (process.env.USE_PGLITE === "0") return false;
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.DATABASE_URL) return false;
  return true;
}
