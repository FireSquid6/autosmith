/**
 * api.ts — the Fleet Ship HTTP + WebSocket API, built as a single Elysia
 * chain so Eden Treaty can infer route types from `typeof app` on the CLI side.
 */

import { Elysia, t } from "elysia";
import { TerminalBridge } from "webterm";
import type { ClientMsg, ServerMsg } from "webterm/protocol";
import { WorkspaceError, WorkspaceManager } from "./workspace-manager";
import type { FleetShipConfig } from "fleet-protocol";

// One terminal connection per workspace session — guards against two browser
// tabs racing to attach the same tmux session through separate PTYs.
const activeTerminals = new Map<string, true>();

function mapError(err: unknown): { status: number; body: { error: string } } {
  if (err instanceof WorkspaceError) {
    return { status: err.status, body: { error: err.message } };
  }
  return { status: 500, body: { error: err instanceof Error ? err.message : String(err) } };
}

export function createApp(manager: WorkspaceManager, config: FleetShipConfig) {
  // Fan workspace state-change events out to every connected /events client.
  const eventClients = new Set<{ send: (data: string) => unknown }>();
  manager.subscribe((event) => {
    const payload = JSON.stringify(event);
    for (const client of eventClients) client.send(payload);
  });

  return new Elysia()
    .get(
      "/workspaces",
      async ({ query, set }) => {
        try {
          const active =
            query.active === undefined
              ? undefined
              : query.active === "true"
                ? "active"
                : query.active === "false"
                  ? "inactive"
                  : undefined;
          return await manager.list(active);
        } catch (err) {
          const mapped = mapError(err);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        query: t.Object({
          active: t.Optional(t.String()),
        }),
      },
    )
    .get("/workspaces/:repo/:name", async ({ params, set }) => {
      try {
        return await manager.get(params.repo, params.name);
      } catch (err) {
        const mapped = mapError(err);
        set.status = mapped.status;
        return mapped.body;
      }
    })
    .post(
      "/workspaces",
      async ({ body, set }) => {
        try {
          set.status = 201;
          return await manager.create(body);
        } catch (err) {
          const mapped = mapError(err);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          repo: t.String(),
          name: t.String(),
          branch: t.String(),
        }),
      },
    )
    .post(
      "/workspaces/:repo/:name/branch",
      async ({ params, body, set }) => {
        try {
          await manager.switchBranch(params.repo, params.name, body);
          return { ok: true as const };
        } catch (err) {
          const mapped = mapError(err);
          set.status = mapped.status;
          return mapped.body;
        }
      },
      {
        body: t.Object({
          branch: t.String(),
        }),
      },
    )
    .post("/workspaces/:repo/:name/activate", async ({ params, set }) => {
      try {
        await manager.activate(params.repo, params.name);
        return { ok: true as const };
      } catch (err) {
        const mapped = mapError(err);
        set.status = mapped.status;
        return mapped.body;
      }
    })
    .post("/workspaces/:repo/:name/deactivate", async ({ params, set }) => {
      try {
        await manager.deactivate(params.repo, params.name);
        return { ok: true as const };
      } catch (err) {
        const mapped = mapError(err);
        set.status = mapped.status;
        return mapped.body;
      }
    })
    .delete("/workspaces/:repo/:name", async ({ params, set }) => {
      try {
        await manager.remove(params.repo, params.name);
        return { ok: true as const };
      } catch (err) {
        const mapped = mapError(err);
        set.status = mapped.status;
        return mapped.body;
      }
    })
    .ws("/workspaces/:repo/:name/terminal", {
      open(ws) {
        const { repo, name } = ws.data.params;
        const sessionName = manager.sessionName(repo, name);

        if (activeTerminals.has(sessionName)) {
          ws.send(JSON.stringify({ type: "exit", code: 1 } satisfies ServerMsg));
          ws.close();
          return;
        }
        activeTerminals.set(sessionName, true);

        const bridge = new TerminalBridge({
          argv: ["tmux", "-L", "fleet-ship", "attach", "-t", sessionName],
          send: (msg: ServerMsg) => {
            ws.send(JSON.stringify(msg));
          },
        });

        (ws.data as { bridge?: TerminalBridge; sessionName?: string }).bridge = bridge;
        (ws.data as { bridge?: TerminalBridge; sessionName?: string }).sessionName = sessionName;
      },
      message(ws, message) {
        const bridge = (ws.data as { bridge?: TerminalBridge }).bridge;
        if (!bridge) return;
        const parsed: ClientMsg = typeof message === "string" ? JSON.parse(message) : (message as ClientMsg);
        bridge.handle(parsed);
      },
      close(ws) {
        const data = ws.data as { bridge?: TerminalBridge; sessionName?: string };
        data.bridge?.stop();
        if (data.sessionName) activeTerminals.delete(data.sessionName);
      },
    })
    .ws("/events", {
      async open(ws) {
        // Register first so a change emitted during the snapshot is still delivered
        // (change events embed the full summary, so an overlap is idempotent).
        eventClients.add(ws);
        ws.send(JSON.stringify(await manager.snapshotEvent()));
      },
      message() {
        // Read-only stream: ignore anything the client sends.
      },
      close(ws) {
        eventClients.delete(ws);
      },
    });
}

export type App = ReturnType<typeof createApp>;
