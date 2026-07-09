import type { WorkspaceDiff } from "fleet-protocol";
import type { FleetBridge } from "./provider";
import type { FleetRepo, LogLine, Ship, Workspace, WorkspaceDetail } from "./types";

/**
 * In-memory implementation of {@link FleetBridge}. Seed data and the canned
 * session transcripts are ported from the design prototype (`support.js`); the
 * `active` flags are mutable so activate/deactivate persist for the session.
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

const TASKS: Record<string, string> = {
  main: "scheduled verification — no open task",
  "fix/rate-limit": "Fix limiter dropping burst traffic above 200 rps",
  "release/2.3": "Cut release 2.3 and tag build artifacts",
  "feat/oauth-pkce": "Implement OAuth 2.1 PKCE authorization flow",
  "feat/redesign": "Rebuild dashboard shell on the new grid system",
  "hotfix/csp": "Patch CSP header blocking inline styles",
  "spike/backfill": "Prototype nightly backfill job",
  "feat/push": "Add APNs / FCM push notification delivery",
};

const PATCHES: Record<string, LogLine[]> = {
  main: [
    { type: "agent", text: "agent  ▸ no open task — running scheduled verification" },
    { type: "cmd", text: "$ git log --oneline -3" },
    { type: "out", text: "a1b2c3d  chore: bump dependencies" },
    { type: "out", text: "e4f5a6b  fix: null guard in client" },
    { type: "out", text: "c7d8e9f  docs: update readme" },
  ],
  "fix/rate-limit": [
    { type: "agent", text: "agent  ▸ editing src/middleware/rateLimit.ts" },
    { type: "del", text: "-  const bucket = new TokenBucket({ rate: 200 })" },
    { type: "add", text: "+  const bucket = new TokenBucket({ rate: 200, burst: 40 })" },
    { type: "agent", text: "agent  ▸ added regression test for burst window" },
  ],
  "release/2.3": [
    { type: "agent", text: "agent  ▸ verifying changelog and version bump" },
    { type: "cmd", text: "$ npm version 2.3.0 --no-git-tag-version" },
    { type: "out", text: "v2.3.0" },
    { type: "warn", text: "!  awaiting sign-off before tagging release" },
  ],
  "feat/oauth-pkce": [
    { type: "agent", text: "agent  ▸ scaffolding src/auth/pkce.ts" },
    { type: "add", text: "+  export function challenge(verifier: string)" },
    { type: "add", text: "+    return base64url(sha256(verifier))" },
    { type: "warn", text: "!  TODO: wire /authorize redirect params" },
  ],
  "feat/redesign": [
    { type: "agent", text: "agent  ▸ rebuilding src/app/Shell.tsx on new grid" },
    { type: "del", text: '-  <div className="sidebar-old">' },
    { type: "add", text: "+  <nav className=\"rail\" data-cols={4}>" },
    { type: "agent", text: "agent  ▸ migrating 6 views to grid layout" },
  ],
  "hotfix/csp": [
    { type: "agent", text: "agent  ▸ patching server/headers.ts" },
    { type: "del", text: "-  \"style-src 'self'\"" },
    { type: "add", text: "+  \"style-src 'self' 'nonce-…'\"" },
    { type: "ok", text: "✓ inline styles no longer blocked" },
  ],
  "spike/backfill": [
    { type: "agent", text: "agent  ▸ prototyping jobs/backfill.ts" },
    { type: "cmd", text: "$ node jobs/backfill.ts --dry-run --since=30d" },
    { type: "out", text: "scanned 1.2M rows · 0 written (dry-run)" },
    { type: "warn", text: "!  spike only — not wired to scheduler" },
  ],
  "feat/push": [
    { type: "agent", text: "agent  ▸ adding push/apns.ts and push/fcm.ts" },
    { type: "add", text: "+  await apns.send(token, payload)" },
    { type: "add", text: "+  await fcm.send(token, payload)" },
    { type: "agent", text: "agent  ▸ registering delivery webhook" },
  ],
};

const DEFAULT_PATCH: LogLine[] = [
  { type: "agent", text: "agent  ▸ inspecting recent commits" },
  { type: "cmd", text: "$ git log --oneline -2" },
  { type: "out", text: "a1b2c3d  chore: bump deps" },
  { type: "out", text: "e4f5g6h  refactor: extract client" },
];

const BLANK: LogLine = { type: "blank", text: " " };

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

function taskFor(branch: string): string {
  return TASKS[branch] ?? `Investigate failing checks on ${branch}`;
}

function patchLines(branch: string): LogLine[] {
  return PATCHES[branch] ?? DEFAULT_PATCH;
}

function buildLog(w: Workspace): LogLine[] {
  const pid = hashPid(w.name);
  const head: LogLine[] = [
    { type: "sys", text: `● session attached  ·  ${w.ship}  ·  pid ${pid}  ·  ${w.repo}@${w.branch}` },
    { type: "sys", text: "● orchestra-agent 0.9.2  ·  model sonnet-4.5  ·  ctx 148k / 200k" },
    BLANK,
    { type: "agent", text: `agent  ▸ task — ${taskFor(w.branch)}` },
    { type: "cmd", text: "$ git fetch origin && git status -sb" },
    { type: "out", text: `## ${w.branch}...origin/${w.branch}` },
    BLANK,
  ];
  const tail: LogLine[] = [
    BLANK,
    { type: "cmd", text: "$ npm run test -- --changed" },
    { type: "out", text: "  Test Suites: 3 passed, 3 total" },
    { type: "ok", text: "  Tests:       27 passed, 27 total   (2.4s)" },
    { type: "cmd", text: "$ npm run lint" },
    { type: "ok", text: "✓ 0 problems" },
    BLANK,
    { type: "agent", text: "agent  ▸ 3 files changed — awaiting your review" },
  ];
  return [...head, ...patchLines(w.branch), ...tail];
}

export class MockFleetBridge implements FleetBridge {
  private readonly workspaces: Workspace[] = SEED_WORKSPACES.map((w) => ({ ...w }));
  /** Operator-typed lines appended to a session, keyed by `repo/name`. */
  private readonly appended = new Map<string, LogLine[]>();

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

  async openSession(repo: string, name: string): Promise<LogLine[]> {
    const w = this.find(repo, name);
    return [...buildLog(w), ...(this.appended.get(key(repo, name)) ?? [])];
  }

  async sendCommand(repo: string, name: string, cmd: string): Promise<LogLine[]> {
    const lines: LogLine[] = [
      { type: "cmd", text: `$ ${cmd}` },
      { type: "sys", text: "↳ forwarded to agent session" },
    ];
    const k = key(repo, name);
    this.appended.set(k, [...(this.appended.get(k) ?? []), ...lines]);
    return lines;
  }
}
