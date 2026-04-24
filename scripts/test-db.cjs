const path = require("path");
const { pathToFileURL } = require("url");
require("dotenv").config({ path: path.join(__dirname, "../.env.local"), quiet: true });
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const postgres = require("postgres");

async function main() {
  const { pgliteModeFromEnv, getPostgresUrlFromEnv } = await import(
    pathToFileURL(path.join(__dirname, "resolve-pglite.mjs")).href,
  );
  if (pgliteModeFromEnv()) {
    console.log(
      "Modo PGlite: não há conexão remota. Para testar, use a app (npm run dev). Para testar a URL de um Neon, defina DATABASE_URL (e, se quiser, USE_PGLITE=0).",
    );
    process.exit(0);
  }
  const url = getPostgresUrlFromEnv();
  if (!url) {
    console.error(
      "Falha: nenhuma URL de Postgres (DATABASE_URL ou STORAGE_* no Vercel). Veja .env.example.",
    );
    process.exit(1);
  }
  const sql = postgres(url, { max: 1, prepare: false });
  const rows = await sql`select 1 as ok, current_database() as database, version() as version`;
  console.log("Conexão com PostgreSQL OK.");
  console.log("  banco:", rows[0].database);
  console.log("  server:", String(rows[0].version).split("\n")[0]);
  const cols = await sql`
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'clients' and column_name = 'deleted_at'
  `;
  if (cols.length === 0) {
    console.error(
      "A coluna public.clients.deleted_at não existe. Execute: npm run db:push",
    );
    process.exit(1);
  }
  console.log("  schema: public.clients possui a coluna deleted_at.");
  await sql.end();
}

main().catch((e) => {
  console.error("Erro de conexão:", e.message || e);
  process.exit(1);
});
