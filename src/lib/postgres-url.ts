/**
 * URL de conexão ao Postgres. Prioridade: `DATABASE_URL` (nome canónico) e, em seguida,
 * `STORAGE_*` — integração Neon no Vercel costuma expor só estes.
 */
export function getAppPostgresUrl(): string | undefined {
  const u =
    process.env.DATABASE_URL?.trim() ||
    process.env.STORAGE_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    process.env.STORAGE_DATABASE_URL_UNPOOLED?.trim();
  return u || undefined;
}

export function isRemotePostgresUrlConfigured(): boolean {
  return Boolean(getAppPostgresUrl());
}
