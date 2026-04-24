/**
 * Aplica as migrações em ./drizzle na ordem do journal.
 * Só use se o banco tiver tabela `drizzle.__drizzle_migrations` coerente
 * com o histórico (ex.: nunca usou `db:push` para criar o esquema base),
 * senão use `drizzle-kit push` (npm run db:sync).
 */
import path from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from "dotenv";
import { getPostgresUrlFromEnv } from "./resolve-pglite.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

config({ path: path.join(root, ".env.local"), quiet: true });
config({ path: path.join(root, ".env"), quiet: true });

const url = getPostgresUrlFromEnv();
if (!url) {
  console.error("Falta DATABASE_URL (ou STORAGE_DATABASE_URL no Vercel).");
  process.exit(1);
}

const client = postgres(url, { max: 1, prepare: false });
const db = drizzle(client);
const folder = path.join(root, "drizzle");

try {
  await migrate(db, { migrationsFolder: folder });
} catch (e) {
  console.error("apply-migration-files: falha (veja a mensagem).", e);
  process.exit(1);
} finally {
  await client.end();
}

process.stdout.write("Migrações .sql aplicadas.\n");
