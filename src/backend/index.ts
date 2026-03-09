import { serve } from "bun";
import index from "../index.html";
import { server } from "./server";

export interface ServerOptions {
  port: number;
}


export function startServer({
  port,
}: ServerOptions) {
  server.assertAllDefined();

  const httpServer = serve({
    port: port,
    routes: {
      // Serve index.html for all unmatched routes.
      "/*": index,

      "/api/covenant": async (req) => {
        return server.handle(req);
      },

      "/api/hello/:name": async req => {
        const name = req.params.name;
        return Response.json({
          message: `Hello, ${name}!`,
        });
      },
    },

    development: process.env.NODE_ENV !== "production" && {
      // Enable browser hot reloading in development
      hmr: true,

      // Echo console logs from the browser to the server
      console: true,
    },
  });
  console.log(`🚀 Server running at ${httpServer.url}`);

  return httpServer;
}

