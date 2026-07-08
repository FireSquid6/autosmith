/**
 * src/repo.ts — the repo DTO reported by a ship's `GET /repos` route (and
 * merged fleet-wide by the bridge).
 *
 * A "repo" is a top-level grouping under a ship's `fleetDirectory`: the
 * `<repo>` directory that holds one or more workspace clones (`<repo>/<name>`).
 * Like `WorkspaceStatus`, this travels over the typed Eden surface, so it is a
 * plain interface (no zod schema).
 */

export interface RepoSummary {
  /** Repo id — the directory basename under `fleetDirectory`. */
  readonly repo: string;
  /** Origin fetch URL shared by the repo's clones, or null if none is set. */
  readonly remote: string | null;
  /** Number of workspaces cloned under this repo. */
  readonly workspaces: number;
}
