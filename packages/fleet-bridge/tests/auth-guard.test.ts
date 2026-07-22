/**
 * auth-guard.test.ts — the bridge's authentication enforcement.
 *
 * HTTP: protected routes require a human session cookie OR the service-token
 * Bearer, while `/auth/*` stays public. WS: the terminal stream requires a
 * single-use ticket (rejection needs no upstream ship, so it's tested against a
 * real listening bridge with no ships registered).
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FleetManager } from "../src/fleet-manager";
import { AuthService } from "../src/auth-service";
import { createApp } from "../src/api";
import { Store } from "../src/store/store";
import { SESSION_COOKIE } from "../src/api/cookies";
import { FakeSocket, makeDeps, ws, type FakeShip } from "./helpers";

const SERVICE_TOKEN = "guard-service-token";

describe("bridge auth guard (HTTP)", () => {
  let dir: string;
  let manager: FleetManager;
  let auth: AuthService;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "fleet-guard-"));
    FakeSocket.byBase.clear();
    const ships = new Map<string, FakeShip>([
      ["http://ship-a", { name: "ship-a", workspaces: [ws("repo1", "one", true)] }],
    ]);
    const config = { dataDirectory: dir, port: 4800, name: "bridge", serviceToken: SERVICE_TOKEN };
    const store = new Store(dir);
    await store.load();
    await store.createShip({ name: "ship-a", url: "http://ship-a" });
    manager = new FleetManager(config, makeDeps(ships), { syncTimeoutMs: 50, store });
    auth = new AuthService(store, { sessionTtlMs: 60_000 });
    await manager.init();
    app = createApp(manager, config, auth);
  });
  afterEach(async () => {
    manager.shutdown();
    await rm(dir, { recursive: true, force: true });
  });

  const status = (path: string, headers?: Record<string, string>) =>
    app.handle(new Request(`http://bridge${path}`, { headers })).then((r) => r.status);

  test("protected routes 401 without a credential", async () => {
    expect(await status("/ships")).toBe(401);
    expect(await status("/workspaces")).toBe(401);
    expect(await status("/repos")).toBe(401);
    expect(await status("/system-resources")).toBe(401);
  });

  test("the service-token Bearer is accepted", async () => {
    expect(await status("/ships", { authorization: `Bearer ${SERVICE_TOKEN}` })).toBe(200);
    expect(await status("/ships", { authorization: "Bearer wrong" })).toBe(401);
  });

  test("a valid session cookie is accepted", async () => {
    await auth.createUser("admin", "pw");
    const login = await app.handle(
      new Request("http://bridge/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "pw" }),
      }),
    );
    const setCookie = login.headers.get("set-cookie")!;
    const token = setCookie.match(new RegExp(`${SESSION_COOKIE}=([^;]*)`))![1]!;

    expect(await status("/ships", { cookie: `${SESSION_COOKIE}=${token}` })).toBe(200);
    expect(await status("/ships", { cookie: `${SESSION_COOKIE}=bogus` })).toBe(401);
  });

  test("/auth routes stay public", async () => {
    expect(await status("/auth/config")).toBe(200);
    const cfg = await app.handle(new Request("http://bridge/auth/config")).then((r) => r.json());
    expect(cfg).toEqual({ authRequired: true });
    expect(await status("/auth/whoami")).toBe(401); // reachable, but no session
  });
});

describe("bridge auth guard (terminal WS ticket)", () => {
  let dir: string;
  let manager: FleetManager;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "fleet-guard-ws-"));
    FakeSocket.byBase.clear();
    const config = { dataDirectory: dir, port: 4800, name: "bridge", serviceToken: SERVICE_TOKEN };
    const store = new Store(dir);
    await store.load();
    manager = new FleetManager(config, makeDeps(new Map()), { syncTimeoutMs: 50, store });
    const auth = new AuthService(store, { sessionTtlMs: 60_000 });
    await manager.init();
    app = createApp(manager, config, auth);
    app.listen(0);
  });
  afterEach(async () => {
    app.server?.stop(true);
    manager.shutdown();
    await rm(dir, { recursive: true, force: true });
  });

  test("terminal WS without a ticket is rejected with an exit frame", async () => {
    const url = `ws://localhost:${app.server?.port}/workspaces/repo1/one/terminal`;
    const sock = new WebSocket(url);
    const frame = await new Promise<string>((resolve, reject) => {
      sock.addEventListener("message", (e) => resolve(String(e.data)), { once: true });
      sock.addEventListener("close", () => reject(new Error("closed with no frame")), { once: true });
      setTimeout(() => reject(new Error("timed out")), 2000);
    }).catch((e) => `ERROR:${e.message}`);
    try {
      sock.close();
    } catch {
      // already closed
    }
    expect(JSON.parse(frame)).toEqual({ type: "exit", code: 1 });
  });
});
