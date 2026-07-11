/**
 * Bun test preload: rebuild the ephemeral migrations from an empty database so every
 * test run starts from a clean schema. `drizzle/ephemeral` is gitignored and never
 * hand-maintained — it is derived here from `src/db/schema.ts`.
 *
 * Registered as `[test] preload` in both the repo-root and fleet-bridge `bunfig.toml`
 * so it runs whether tests are launched via `bun test tests` (root) or the app's own
 * `bun test ../../tests/fleet-bridge`.
 */
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "../../apps/fleet-bridge");

rmSync(join(appDir, "drizzle/ephemeral"), { recursive: true, force: true });

const gen = Bun.spawnSync(
  ["bunx", "drizzle-kit", "generate", "--config", "drizzle-configs/ephemeral.config.ts"],
  { cwd: appDir, stdout: "pipe", stderr: "pipe" },
);
if (gen.exitCode !== 0) {
  throw new Error(
    `failed to regenerate ephemeral drizzle migrations:\n${gen.stderr.toString()}${gen.stdout.toString()}`,
  );
}
