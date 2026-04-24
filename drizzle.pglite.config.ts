import { resolve } from "path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: resolve(process.cwd(), ".env.local"), quiet: true });
config({ path: resolve(process.cwd(), ".env"), quiet: true });

const dir = process.env.PGLITE_DATA_DIR ?? ".pglite-data";
const url = dir.startsWith("file:") ? dir : `file:${resolve(process.cwd(), dir)}`;

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  driver: "pglite",
  dbCredentials: { url },
});
