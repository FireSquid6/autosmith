import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { EdenFleetBridge } from "../src/data/eden";
import { makeBridgeClient } from "../src/data/client";
import { MockFleetBridge } from "../src/data/mock";
import type { WorkspaceEvent } from "../src/data/types";

describe("EdenFleetBridge workspace mutations hit the right routes", () => {
  let server: ReturnType<typeof Bun.serve>;
  let requests: { method: string; path: string; body: unknown }[];
  let bridge: EdenFleetBridge;

  beforeEach(() => {
    requests = [];
    server = Bun.serve({
      port: 0,
      async fetch(request) {
        const url = new URL(request.url);
        let body: unknown = null;
        if (request.method !== "GET" && request.method !== "DELETE") {
          try {
            body = await request.json();
          } catch {
            body = null;
          }
        }
        requests.push({ method: request.method, path: url.pathname, body });
        return Response.json({ ok: true });
      },
    });
    bridge = new EdenFleetBridge(makeBridgeClient(`http://localhost:${server.port}`));
  });

  afterEach(() => server.stop(true));

  test("switchBranch POSTs to the branch route with the new branch", async () => {
    await bridge.switchBranch("api-gateway", "ws-1", "feat/x");
    expect(requests).toEqual([
      { method: "POST", path: "/workspaces/api-gateway/ws-1/branch", body: { branch: "feat/x" } },
    ]);
  });

  test("deleteWorkspace DELETEs the workspace route", async () => {
    await bridge.deleteWorkspace("api-gateway", "ws-1");
    expect(requests).toEqual([{ method: "DELETE", path: "/workspaces/api-gateway/ws-1", body: null }]);
  });
});

describe("MockFleetBridge workspace mutations", () => {
  test("switchBranch updates the branch and emits branch_changed", async () => {
    const mock = new MockFleetBridge();
    const events: WorkspaceEvent[] = [];
    const unsubscribe = mock.subscribeWorkspaces((e) => events.push(e));

    const target = (await mock.listWorkspaces())[0]!;
    await mock.switchBranch(target.repoName, target.name, "feat/new");

    const after = (await mock.listWorkspaces()).find(
      (w) => w.repoName === target.repoName && w.name === target.name,
    );
    expect(after?.branch).toBe("feat/new");
    expect(events.at(-1)).toMatchObject({
      type: "workspace.branch_changed",
      workspace: { name: target.name, branch: "feat/new" },
    });
    unsubscribe();
  });

  test("deleteWorkspace removes the workspace and emits removed", async () => {
    const mock = new MockFleetBridge();
    const events: WorkspaceEvent[] = [];
    mock.subscribeWorkspaces((e) => events.push(e));

    const before = await mock.listWorkspaces();
    const target = before[0]!;
    await mock.deleteWorkspace(target.repoName, target.name);

    const after = await mock.listWorkspaces();
    expect(after).toHaveLength(before.length - 1);
    expect(after.some((w) => w.repoName === target.repoName && w.name === target.name)).toBe(false);
    expect(events.at(-1)).toMatchObject({ type: "workspace.removed", workspace: { name: target.name } });
  });

  test("deleteWorkspace rejects for an unknown workspace", async () => {
    const mock = new MockFleetBridge();
    await expect(mock.deleteWorkspace("nope", "nope")).rejects.toThrow("workspace not found");
  });
});
