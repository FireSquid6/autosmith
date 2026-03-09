import { Command } from "@commander-js/extra-typings";
import { startServer } from "./backend";

const serveCommand = new Command()
  .name("serve")
  .option("-p, --port [port]")
  .action(({ port: portString }) => {
    const port = typeof portString === "string" ? parseInt(portString) : 4456
    startServer({ port });
  })



const mainCommand = new Command()
mainCommand.addCommand(serveCommand)

mainCommand.parse();
