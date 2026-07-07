/**
 * src/workspace.ts — the workspace DTOs shared between the ship (host) and the CLI.
 *
 * A workspace is a git clone of `<repo>` on `<branch>`, living at
 * `<fleetDirectory>/<repo>/<name>`. It is identified by the `(repo, name)` pair —
 * names are unique only within a repo — and is either `active` (a tmux session
 * exists) or `inactive` (only the directory exists).
 */

/** Summary row returned by `GET /workspaces` (list view). */
export interface WorkspaceSummary {
  /** Repo the workspace belongs to (the clone URL basename, `.git` stripped). */
  readonly repo: string;
  /** Workspace name, unique within its repo. */
  readonly name: string;
  /** Currently checked-out branch. */
  readonly branch: string;
  /** Whether a tmux session is currently up for this workspace. */
  readonly active: boolean;
}

/** Git diff summary for an active workspace. */
export interface WorkspaceDiff {
  /** Lines added across the working tree. */
  readonly added: number;
  /** Lines removed across the working tree. */
  readonly removed: number;
  /** Number of commits ahead of the upstream branch (0 if no upstream). */
  readonly commits: number;
}

/** Detailed status returned by `GET /workspaces/:repo/:name`. */
export type WorkspaceStatus =
  | {
      readonly state: "inactive";
      readonly repo: string;
      readonly name: string;
      readonly branch: string;
    }
  | {
      readonly state: "active";
      readonly repo: string;
      readonly name: string;
      readonly branch: string;
      readonly diff: WorkspaceDiff;
      // The fields below are placeholders for later features; always null for now.
      readonly issue: null;
      readonly mergeRequest: null;
      readonly agentProvider: null;
      readonly agentProfile: null;
      readonly agentStatus: null;
      /** Name of the ship (host) this workspace lives on, from the ship config. */
      readonly ship: string;
    };

/** Body of `POST /workspaces` — create a new workspace by cloning a repo/branch. */
export interface CreateWorkspaceRequest {
  readonly repo: string;
  readonly name: string;
  readonly branch: string;
}

/** Body of `POST /workspaces/:repo/:name/branch` — switch to (and create) a branch. */
export interface SwitchBranchRequest {
  readonly branch: string;
}
