import type { WorkspaceDiff } from "fleet-protocol";
import type { FleetBridge } from "./provider";
import type { FleetRepo, Ship, Workspace, WorkspaceDetail } from "./types";

/**
 * In-memory implementation of {@link FleetBridge}. Seed data is ported from the
 * design prototype (`support.js`); the `active` flags are mutable so
 * activate/deactivate persist for the session. The live terminal is not mocked —
 * it streams over a real WebSocket (see the Terminal component's `useWebterm`).
 */

const SHIPS: Ship[] = [
  { name: "forge-01", spec: "2×A100 · us-east-1", status: "online" },
  { name: "forge-02", spec: "2×A100 · us-east-1", status: "online" },
  { name: "atlas-7", spec: "8×H100 · eu-west-2", status: "online" },
  { name: "nimbus", spec: "32 vCPU · us-west-2", status: "online" },
];

const SEED_WORKSPACES: Workspace[] = [
  { name: "ws-4f2a", repo: "api-gateway", ship: "forge-01", branch: "main", active: true },
  { name: "ws-9c11", repo: "api-gateway", ship: "forge-01", branch: "fix/rate-limit", active: true },
  { name: "ws-2e70", repo: "api-gateway", ship: "atlas-7", branch: "release/2.3", active: false },
  { name: "ws-6b83", repo: "auth-svc", ship: "forge-02", branch: "main", active: true },
  { name: "ws-d904", repo: "auth-svc", ship: "nimbus", branch: "feat/oauth-pkce", active: false },
  { name: "ws-1a5f", repo: "web-client", ship: "forge-01", branch: "main", active: true },
  { name: "ws-7fc2", repo: "web-client", ship: "forge-02", branch: "feat/redesign", active: true },
  { name: "ws-3d18", repo: "web-client", ship: "atlas-7", branch: "hotfix/csp", active: false },
  { name: "ws-8e40", repo: "billing", ship: "atlas-7", branch: "main", active: true },
  { name: "ws-c227", repo: "notifier", ship: "nimbus", branch: "main", active: false },
  { name: "ws-5b96", repo: "data-pipeline", ship: "forge-02", branch: "main", active: true },
  { name: "ws-0a3e", repo: "data-pipeline", ship: "forge-02", branch: "spike/backfill", active: false },
  { name: "ws-b6d1", repo: "search-idx", ship: "atlas-7", branch: "main", active: true },
  { name: "ws-e812", repo: "mobile-bff", ship: "nimbus", branch: "feat/push", active: true },
];

function key(repo: string, name: string): string {
  return `${repo}/${name}`;
}

/** Deterministic pseudo-pid from a workspace name (matches the prototype hash). */
function hashPid(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return 10000 + (Math.abs(h) % 89999);
}

/** Deterministic mock working-tree diff for an active workspace. */
function mockDiff(name: string): WorkspaceDiff {
  const h = Math.abs(hashPid(name));
  return { added: 8 + (h % 40), removed: h % 15, commits: 1 + (h % 3) };
}

export class MockFleetBridge implements FleetBridge {
  private readonly workspaces: Workspace[] = SEED_WORKSPACES.map((w) => ({ ...w }));

  private find(repo: string, name: string): Workspace {
    const w = this.workspaces.find((x) => x.repo === repo && x.name === name);
    if (!w) throw new Error(`workspace not found: ${key(repo, name)}`);
    return w;
  }

  async listShips(): Promise<Ship[]> {
    return SHIPS.map((s) => ({ ...s }));
  }

  async listRepos(): Promise<FleetRepo[]> {
    // Merge workspaces into fleet-wide repo rows, preserving first-seen order —
    // this is what the bridge does across ships in `GET /repos`.
    const order: string[] = [];
    const byRepo = new Map<string, { ships: Set<string>; count: number }>();
    for (const w of this.workspaces) {
      let entry = byRepo.get(w.repo);
      if (!entry) {
        entry = { ships: new Set(), count: 0 };
        byRepo.set(w.repo, entry);
        order.push(w.repo);
      }
      entry.ships.add(w.ship);
      entry.count++;
    }
    return order.map((repo) => {
      const entry = byRepo.get(repo)!;
      return {
        repo,
        remote: `git@github.com:orchestra/${repo}.git`,
        workspaces: entry.count,
        ships: [...entry.ships],
      };
    });
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return this.workspaces.map((w) => ({ ...w }));
  }

  async getWorkspace(repo: string, name: string): Promise<WorkspaceDetail> {
    const w = this.find(repo, name);
    if (!w.active) {
      return { state: "inactive", repo: w.repo, name: w.name, branch: w.branch, ship: w.ship };
    }
    return {
      state: "active",
      repo: w.repo,
      name: w.name,
      branch: w.branch,
      diff: mockDiff(w.name),
      issue: null,
      mergeRequest: null,
      agentProvider: null,
      agentProfile: null,
      agentStatus: null,
      ship: w.ship,
    };
  }

  async activateWorkspace(repo: string, name: string): Promise<void> {
    this.find(repo, name).active = true;
  }

  async deactivateWorkspace(repo: string, name: string): Promise<void> {
    this.find(repo, name).active = false;
  }
}
