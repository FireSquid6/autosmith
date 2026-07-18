import { Command } from "commander";
import { loadConfig } from "./config";
import { WorkspaceManager } from "./workspace-manager";
import { createApp } from "./api";

const ship = new Command();

ship.name("ship").description("Fleet Ship workspace host").version("0.1.0");

ship
  .command("start")
  .description("start the Fleet Ship HTTP + WebSocket API")
  .option("-c, --config <path>", "path to the fleet-ship config yaml", "./fleet-ship-config.yaml")
  .action(async (options: { config: string }) => {
    const config = await loadConfig(options.config);
    const manager = new WorkspaceManager(config);
    const app = createApp(manager, config);
    app.listen(config.port);
    console.log(`fleet-ship "${config.name}" listening on http://localhost:${config.port}`);
  });

ship.parseAsync(process.argv);
