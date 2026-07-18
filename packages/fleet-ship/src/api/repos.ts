/**
 * api/repos.ts — the ship's `GET /repos` route, as its own Elysia plugin.
 * Lists the repo groupings under the ship's fleet directory (id, remote, and
 * workspace count). One Elysia chain so route types stay inferable for Eden.
 */

import { Elysia } from "elysia";
import type { WorkspaceManager } from "../workspace-manager";
import { mapError } from "./http";

export function reposPlugin(manager: WorkspaceManager) {
  return new Elysia({ name: "ship-repos" }).get("/repos", async ({ set }) => {
    try {
      return await manager.listRepos();
    } catch (err) {
      const mapped = mapError(err);
      set.status = mapped.status;
      return mapped.body;
    }
  });
}
