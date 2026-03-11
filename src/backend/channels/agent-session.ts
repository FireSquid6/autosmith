import type { AppServer } from "../server-types";
import type { AgentManager } from "../agent-manager";

export function registerAgentSessionChannel(server: AppServer, agents: AgentManager) {
  server.defineChannel("agentSession", {
    onConnect: async ({ params, reject }) => {
      const projectName = params.projectName ?? "";
      const agentName = params.agentName ?? "";
      if (!agents.isRunning(projectName, agentName)) {
        reject("Agent is not running", "client");
      }
      return { projectName, agentName };
    },

    onMessage: async ({ inputs, params, error }) => {
      const agent = agents.get(params.projectName ?? "", params.agentName ?? "");
      if (!agent) return error("Agent is not running", "client");

      if (inputs.type === "compact") {
        await agent.compact();
        return;
      }

      if (inputs.type === "clear") {
        await agent.clear();
        return;
      }

      // inputs.type === "input"
      for await (const event of agent.send(inputs.text)) {
        if (event.type === "error") {
          await server.sendMessage("agentSession", params, {
            type: "error",
            error: String(event.error),
          });
        } else {
          await server.sendMessage("agentSession", params, event);
        }
      }

      await server.sendMessage("agentSession", params, { type: "done" });
    },
  });
}
