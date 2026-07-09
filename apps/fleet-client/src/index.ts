import { serve } from "bun";
import index from "./index.html";

/**
 * Real bridge origin the `/bridge/*` proxy forwards to. Configure with the
 * `BRIDGE_URL` env var; defaults to a local bridge.
 */
const BRIDGE_URL = (process.env.BRIDGE_URL ?? "http://localhost:4700").replace(/\/$/, "");

/**
 * Reverse-proxy `/bridge/<path>` → `${BRIDGE_URL}/<path>`. The browser's Eden
 * treaty talks to this same-origin prefix, so the bridge needs no CORS config.
 */
async function proxyToBridge(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const target = BRIDGE_URL + (url.pathname.replace(/^\/bridge/, "") || "/") + url.search;

  const headers = new Headers(req.headers);
  headers.delete("host");

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== "GET" && req.method !== "HEAD") init.body = await req.arrayBuffer();

  try {
    return await fetch(target, init);
  } catch (err) {
    return Response.json(
      { error: `bridge unreachable at ${BRIDGE_URL}: ${(err as Error).message}` },
      { status: 502 },
    );
  }
}

const server = serve({
  routes: {
    "/bridge/*": proxyToBridge,

    // SPA: every other path resolves to the client bundle so react-router can
    // handle deep links (e.g. /repos/api-gateway/workspaces/ws-4f2a) on refresh.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 fleet-client running at ${server.url} (bridge → ${BRIDGE_URL})`);
