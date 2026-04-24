/**
 * Garante colunas preco, quantidade e titulo em public.orders usando a MESMA
 * DATABASE_URL do Next (getDb). Útil quando o pooler bloqueou DDL no
 * drizzle-kit push ou o push usou outro host.
 */
const path = require("path");
const { pathToFileURL } = require("url");
require("dotenv").config({ path: path.join(__dirname, "../.env.local"), quiet: true });
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const postgres = require("postgres");

async function main() {
  const { getPostgresUrlFromEnv } = await import(
    pathToFileURL(path.join(__dirname, "resolve-pglite.mjs")).href,
  );
  const url = getPostgresUrlFromEnv();
  if (!url) {
    console.error(
      "Falta URL de Postgres (DATABASE_URL ou STORAGE_* no Vercel). Defina em .env.local como na app.",
    );
    process.exit(1);
  }
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql`select 1`;
    const m = url.match(/@([^/?]+)/);
    console.log("Conectando ao Postgres" + (m ? ` (host: ${m[1]})` : "…"));

    await sql.unsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'preco'
        ) THEN
          ALTER TABLE "orders" ADD COLUMN "preco" double precision NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'quantidade'
        ) THEN
          ALTER TABLE "orders" ADD COLUMN "quantidade" integer NOT NULL DEFAULT 1;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'titulo'
        ) THEN
          ALTER TABLE "orders" ADD COLUMN "titulo" text;
          UPDATE "orders" SET "titulo" = CASE
            WHEN trim(coalesce("descricao", '')) = '' THEN 'Pedido'
            ELSE left(trim("descricao"), 200)
          END
          WHERE "titulo" IS NULL;
          ALTER TABLE "orders" ALTER COLUMN "titulo" SET NOT NULL;
        END IF;
      END $$;
    `);
    console.log(
      'Colunas "orders.preco", "orders.quantidade" e "orders.titulo" verificadas/criadas.',
    );
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
