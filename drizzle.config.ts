import { resolve } from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same order as Next.js: .env.local overrides .env (drizzle-kit does not load .env.local by default)
config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Deve ser o *mesmo* banco que a app (getDb(): Neon/postgres usa DATABASE_URL; USE_PGLITE=1 usa drizzle.pglite.config). Se o push
    // cair noutro host/projeto, a app continua a falhar. Para DDL com pooler a falhar, use
    // `DATABASE_URL_UNPOOLED` temporariamente *com a mesma base de dados* ou ajuste `DATABASE_URL`.
    url: (process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED)!,
  },
});
