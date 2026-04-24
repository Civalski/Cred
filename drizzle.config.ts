import { resolve } from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { getAppPostgresUrl } from "./src/lib/postgres-url";

// Same order as Next.js: .env.local overrides .env (drizzle-kit does not load .env.local by default)
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Deve ser o *mesmo* banco que a app (getDb(); USE_PGLITE=1 → drizzle.pglite.config). Se o push
    // cair noutro host/projeto, a app continua a falhar. Para DDL com pooler a falhar, use
    // `DATABASE_URL_UNPOOLED` (ou `STORAGE_DATABASE_URL_UNPOOLED` no Vercel) *na mesma base de dados*.
    url: getAppPostgresUrl()!,
  },
});
