
import { Command } from "commander";
import { loadConfig } from "./config";
import { FleetManager } from "./fleet-manager";
import { createApp } from "./api";

const bridge = new Command();

bridge.name("bridge").description("Fleet Bridge — orchestrates multiple ships").version("0.1.0");

bridge
  .command("start")
  .description("start the Fleet Bridge HTTP + WebSocket API")
  .option("-c, --config <path>", "path to the fleet-bridge config yaml", "./fleet-bridge-config.yaml")
  .action(async (options: { config: string }) => {
    const config = await loadConfig(options.config);
    const manager = new FleetManager(config);

    try {
      await manager.init();
    } catch (err) {
      console.error(`fleet-bridge: ${(err as Error).message}`);
      process.exit(1);
    }

    const app = createApp(manager, config);
    app.listen(config.port);
    console.log(`fleet-bridge "${config.name}" listening on http://localhost:${config.port}`);
  });

export { bridge };
