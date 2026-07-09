import type { SystemResources } from "fleet-protocol";
import { makeBridgeClient, type BridgeClient } from "./client";
import type { FleetBridge } from "./provider";
import type { FleetRepo, LogLine, Ship, Workspace, WorkspaceDetail } from "./types";

/** Turn an Eden `{ error }` value into a thrown Error. */
function edenError(error: { status?: unknown; value?: unknown }): Error {
  const detail = error.value === undefined ? error : error.value;
  return new Error(`fleet-bridge request failed: ${JSON.stringify(detail)}`);
}

/** Human-facing hardware blurb from a ship's system resources. */
function deriveSpec(r: SystemResources | null): string {
  if (!r) return "offline";
  const gb = Math.round(r.memory.total / 1e9);
  return `${r.cpu.cores} cores · ${gb} GB · ${r.os.arch}`;
}

/**
 * Real {@link FleetBridge} backed by an Eden treaty against the fleet bridge.
 * Terminal streaming (openSession/sendCommand) is intentionally left unwired for
 * now — those return informational placeholders.
 */
export class EdenFleetBridge implements FleetBridge {
  constructor(private readonly client: BridgeClient = makeBridgeClient()) {}

  async listShips(): Promise<Ship[]> {
    // The ship roster + spec come from the aggregate resources endpoint, which
    // lists every ship (online with resources, offline with null).
    const { data, error } = await this.client["system-resources"].get();
    if (error) throw edenError(error);
    return data.map((s) => ({ name: s.ship, spec: deriveSpec(s.resources), status: s.status }));
  }

  async listRepos(): Promise<FleetRepo[]> {
    const { data, error } = await this.client.repos.get();
    if (error) throw edenError(error);
    return data;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await this.client.workspaces.get();
    if (error) throw edenError(error);
    // The handler can also surface an in-band `{ error }` body on a 200.
    if (!Array.isArray(data)) throw edenError({ value: data });
    return data;
  }

  async getWorkspace(repo: string, name: string): Promise<WorkspaceDetail> {
    const { data, error } = await this.client.workspaces({ repo })({ name }).get();
    if (error) throw edenError(error);
    if ("error" in data) throw edenError({ value: data.error });
    return data;
  }

  async activateWorkspace(repo: string, name: string): Promise<void> {
    const { error } = await this.client.workspaces({ repo })({ name }).activate.post();
    if (error) throw edenError(error);
  }

  async deactivateWorkspace(repo: string, name: string): Promise<void> {
    const { error } = await this.client.workspaces({ repo })({ name }).deactivate.post();
    if (error) throw edenError(error);
  }

  async openSession(): Promise<LogLine[]> {
    return [
      { type: "sys", text: "● session attached" },
      { type: "sys", text: "● terminal streaming not yet wired to the bridge" },
    ];
  }

  async sendCommand(_repo: string, _name: string, cmd: string): Promise<LogLine[]> {
    return [
      { type: "cmd", text: `$ ${cmd}` },
      { type: "sys", text: "↳ terminal not connected — command not forwarded" },
    ];
  }
}
