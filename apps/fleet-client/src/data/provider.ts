import type { FleetRepo, LogLine, Ship, Workspace, WorkspaceDetail } from "./types";

/**
 * The data our UI needs from the fleet bridge, expressed as one async surface.
 *
 * Every method maps 1:1 to a bridge route. The real implementation would be a
 * thin wrapper over an Eden treaty client:
 *
 *   import { treaty } from "@elysiajs/eden";
 *   import type { App } from "fleet-bridge/api";
 *   const client = treaty<App>(bridgeUrl);
 *   // listWorkspaces() -> client.workspaces.get() -> { data, error }
 *
 * `MockFleetBridge` (see ./mock) implements this against in-memory fixtures so
 * the whole app runs with no bridge attached. Swapping in the Eden-backed
 * implementation is the only change needed to go live.
 */
export interface FleetBridge {
  /** `GET /ships` (joined with `GET /system-resources` for the spec blurb). */
  listShips(): Promise<Ship[]>;
  /** `GET /repos` — fleet-wide merged repo view. */
  listRepos(): Promise<FleetRepo[]>;
  /** `GET /workspaces` — every workspace across all ships. */
  listWorkspaces(): Promise<Workspace[]>;
  /** `GET /workspaces/:repo/:name` — detailed status (diff, ship, …). */
  getWorkspace(repo: string, name: string): Promise<WorkspaceDetail>;
  /** `POST /workspaces/:repo/:name/activate` — attach a session. */
  activateWorkspace(repo: string, name: string): Promise<void>;
  /** `POST /workspaces/:repo/:name/deactivate` — kill the session. */
  deactivateWorkspace(repo: string, name: string): Promise<void>;
  /**
   * The current session transcript for a workspace.
   *
   * Stands in for the live session stream. In production this is the
   * `/workspaces/:repo/:name/terminal` WebSocket (webterm grid protocol) and/or
   * a future agent-output stream; here it returns a canned transcript.
   */
  openSession(repo: string, name: string): Promise<LogLine[]>;
  /**
   * Forward an operator command to the session. Placeholder per the design
   * handoff — the real agent-control protocol replaces this. Returns the lines
   * appended to the transcript.
   */
  sendCommand(repo: string, name: string, cmd: string): Promise<LogLine[]>;
}
