import { serve } from "bun";
import index from "../index.html";
import { createServer } from "./server";

export interface ServerOptions {
  port: number;
  storeDirectory: string;
}

export async function startServer({ port, storeDirectory }: ServerOptions) {
  const { server, agents } = await createServer(storeDirectory, port);

  const httpServer = serve({
    port,
    routes: {
      "/*": index,

      "/api/covenant": async (req) => {
        return server.handle(req);
      },

      "/sidekick": async (req) => {
        return server.handle(req);
      },
    },

    development: process.env.NODE_ENV !== "production" && {
      hmr: true,
      console: true,
    },
  });

  const shutdown = async () => {
    console.log("Shutting down — stopping all agents...");
    await agents.stopAll();
    httpServer.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  console.log(`Server running at ${httpServer.url}`);
  return httpServer;
}
