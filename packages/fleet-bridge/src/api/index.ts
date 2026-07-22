/**
 * api/index.ts — composes the bridge's Elysia app from its two plugins.
 *
 * Both plugins are single Elysia chains, so `.use()` merges their route types
 * into the parent and `App = ReturnType<typeof createApp>` carries the full
 * merged surface for a future Eden `treaty<App>` client.
 */

import { Elysia } from "elysia";
import { MAX_CLIENT_FRAME_BYTES } from "webterm/protocol";
import type { FleetManager } from "../fleet-manager";
import type { AuthService } from "../auth-service";
import { DEFAULT_SESSION_TTL_MS, type BridgeConfig } from "../config";
import { workspacesPlugin } from "./workspaces";
import { shipsPlugin } from "./ships";
import { systemResourcesPlugin } from "./system-resources";
import { reposPlugin } from "./repos";
import { authPlugin } from "./auth";
import { readSessionCookie } from "./cookies";
import { Logestic } from "logestic";

export function createApp(manager: FleetManager, config: BridgeConfig, auth: AuthService) {
  const requireAuth = config.requireAuth ?? true;
  const serviceToken = config.serviceToken;

  return new Elysia({ websocket: { maxPayloadLength: MAX_CLIENT_FRAME_BYTES } })
    // Global gate. `/auth/*` stays public (login/bootstrap self-provision; whoami
    // and ws-ticket self-check their session). WebSocket upgrades pass through so
    // the terminal stream can authenticate with its ticket (browsers can't send a
    // cookie/header on a fresh WS through the client proxy). Everything else needs
    // a human session cookie or the machine service-token Bearer.
    .onRequest(async ({ request, set }) => {
      if (!requireAuth) return;
      const { pathname } = new URL(request.url);
      if (pathname.startsWith("/auth/")) return;
      if (request.headers.get("upgrade")?.toLowerCase() === "websocket") return;

      const bearer = request.headers.get("authorization")?.replace(/^Bearer /, "");
      if (serviceToken && bearer === serviceToken) return;
      if (await auth.resolveSession(readSessionCookie(request))) return;

      set.status = 401;
      return { error: "unauthenticated" };
    })
    .use(Logestic.preset("commontz"))
    .use(
      authPlugin(auth, {
        sessionTtlMs: config.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS,
        secure: process.env.NODE_ENV === "production",
        authRequired: requireAuth,
      }),
    )
    .use(workspacesPlugin(manager, { serviceToken, auth, requireAuth }))
    .use(shipsPlugin(manager))
    .use(systemResourcesPlugin(manager))
    .use(reposPlugin(manager));
}

export type App = ReturnType<typeof createApp>;
