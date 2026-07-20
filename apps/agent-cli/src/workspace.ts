/**
 * workspace.ts — locate the fleet workspace the CLI is being run from.
 *
 * The ship writes `atlas.json` to the root of its data directory, and workspaces
 * live at `<dataDir>/<repo>/<name>`. So from any directory inside a workspace we
 * walk up until we find a valid `atlas.json`: the directory holding it is the
 * data-directory root, and the first two path segments below it are the repo and
 * workspace name. The atlas gives us the port to reach the ship on.
 */

import { dirname, join, relative, resolve, sep } from "node:path";
import { AtlasSchema } from "fleet-protocol";

export interface WorkspaceLocation {
  /** Repo name (first path segment under the ship's data directory). */
  readonly repo: string;
  /** Workspace name (second path segment). */
  readonly name: string;
  /** Base URL of the ship, derived from the atlas port. */
  readonly baseUrl: string;
}

/** Read and validate `<dir>/atlas.json`; returns the port or `null` if absent/invalid. */
async function readAtlasPort(dir: string): Promise<number | null> {
  try {
    const parsed = AtlasSchema.safeParse(await Bun.file(join(dir, "atlas.json")).json());
    return parsed.success ? parsed.data.port : null;
  } catch {
    return null;
  }
}

/**
 * Resolve the workspace containing `startDir` (defaults to the current working
 * directory), or `null` when not inside a fleet workspace.
 */
export async function findWorkspace(startDir: string = process.cwd()): Promise<WorkspaceLocation | null> {
  const start = resolve(startDir);

  let dir = start;
  while (true) {
    const port = await readAtlasPort(dir);
    if (port !== null) {
      // `dir` is the data-directory root; the workspace is two levels below it.
      const segments = relative(dir, start).split(sep).filter((s) => s.length > 0);
      if (segments.length < 2) return null; // at the root or a repo dir, not a workspace
      return { repo: segments[0]!, name: segments[1]!, baseUrl: `http://localhost:${port}` };
    }

    const parent = dirname(dir);
    if (parent === dir) return null; // reached the filesystem root
    dir = parent;
  }
}
