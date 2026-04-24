/**
 * Sincroniza o Postgres com `src/db/schema.ts` (drizzle-kit push).
 * É o que evita "column does not exist" após alterar o schema no código
 * ou dar pull — sem depender do histórico de arquivos em ./drizzle.
 *
 * Defina SKIP_DB_SYNC=1 para pular (ex.: em CI que não tem banco, ou
 * se você aplica só migrações SQL em outro passo de deploy).
 *
 * Ver também: `npm run db:migrate:files` — aplica *apenas* os .sql
 * (útil com DB novo ou histórico __drizzle_migrations alinhado).
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import { pgliteModeFromEnv } from "./resolve-pglite.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

config({ path: path.join(root, ".env.local"), quiet: true });
config({ path: path.join(root, ".env"), quiet: true });

if (process.env.SKIP_DB_SYNC === "1" || process.env.SKIP_MIGRATIONS === "1") {
  process.stdout.write("SKIP_DB_SYNC / SKIP_MIGRATIONS — banco não sincronizado automaticamente.\n");
  process.exit(0);
}

const pglite = pgliteModeFromEnv();

if (!pglite && !process.env.DATABASE_URL) {
  console.error(
    "sync-db: defina DATABASE_URL no .env.local (a mesma URL que o Next usa), ou deixe sem DATABASE_URL em desenvolvimento para usar PGlite, ou USE_PGLITE=1.",
  );
  process.exit(1);
}

try {
  execSync(
    pglite
      ? "npx drizzle-kit push --config=drizzle.pglite.config.ts --force"
      : "npx drizzle-kit push",
    {
      stdio: "inherit",
      cwd: root,
      env: process.env,
      shell: true,
    },
  );
} catch (e) {
  const code = e && typeof e === "object" && "status" in e ? e.status : 1;
  process.exit(typeof code === "number" ? code : 1);
}

process.stdout.write("Banco alinhado ao schema.\n");
