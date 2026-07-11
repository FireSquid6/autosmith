import path from "path";
import { defineConfig } from "drizzle-kit"

const projectRootDir = path.resolve(import.meta.dirname, "../..");

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  out: "./drizzle",
  dbCredentials: {
    "url": path.join(projectRootDir, "dev-data/fleet-bridge-data/bridge.sqlite")
  }
});
