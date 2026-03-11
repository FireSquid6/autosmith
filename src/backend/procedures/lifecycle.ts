import type { AppServer } from "../server-types";
import type { AgentManager } from "../agent-manager";

export function registerLifecycleProcedures(server: AppServer, agents: AgentManager) {
  server.defineProcedure("startAgent", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/status`],
    procedure: async ({ inputs }) => {
      await agents.start(inputs.projectName, inputs.agentName);
      return null;
    },
  });

  server.defineProcedure("stopAgent", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/status`],
    procedure: async ({ inputs }) => {
      await agents.stop(inputs.projectName, inputs.agentName);
      return null;
    },
  });

  server.defineProcedure("isAgentRunning", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/status`],
    procedure: ({ inputs }) => agents.isRunning(inputs.projectName, inputs.agentName),
  });

  server.defineProcedure("getAgentHistory", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/history`],
    procedure: ({ inputs, error }) => {
      const agent = agents.get(inputs.projectName, inputs.agentName);
      if (!agent) error("Agent is not running", 404);
      return agent!.getHistory();
    },
  });
}
