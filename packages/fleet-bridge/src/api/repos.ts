/**
 * api/repos.ts — the bridge's repo routes: a fleet-wide merged view plus a
 * per-ship proxy. One Elysia chain so route types stay inferable for Eden.
 */

import { Elysia } from "elysia";
import type { FleetManager } from "../fleet-manager";
import { mapError } from "./http";

export function reposPlugin(manager: FleetManager) {
  return new Elysia({ name: "bridge-repos" })
    .get("/repos", () => manager.listRepos())
    .get("/ships/:ship/repos", async ({ params, set }) => {
      try {
        return await manager.getShipRepos(params.ship);
      } catch (err) {
        const mapped = mapError(err);
        set.status = mapped.status;
        return mapped.body;
      }
    });
}
