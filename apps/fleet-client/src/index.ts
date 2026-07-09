import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    // SPA: every path resolves to the client bundle so react-router can handle
    // deep links (e.g. /repos/api-gateway/workspaces/ws-4f2a) on a hard refresh.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`🚀 fleet-client running at ${server.url}`);
