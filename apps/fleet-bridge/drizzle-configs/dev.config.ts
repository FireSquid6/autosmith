import path from "path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

// Paths are resolved against the app root (this file's ../..) rather than cwd, so
// `drizzle-kit generate --config drizzle-configs/dev.config.ts` works from anywhere.
const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export default defineConfig({
  schema: path.join(appDir, "src/db/schema.ts"),
  dialect: "sqlite",
  out: path.join(appDir, "drizzle/dev"),
});
