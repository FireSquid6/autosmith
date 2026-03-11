import type { AppServer } from "../server-types";
import type { AutosmithStore } from "../../store";

export function registerAgentProcedures(server: AppServer, store: AutosmithStore) {
  server.defineProcedure("listAgents", {
    resources: ({ inputs }) => [`project/${inputs.projectName}/agents`],
    procedure: async ({ inputs }) => {
      const names = await store.listAgents(inputs.projectName);
      return Promise.all(
        names.map(async agentName => ({
          projectName: inputs.projectName,
          ...(await store.getAgent(inputs.projectName, agentName)),
        })),
      );
    },
  });

  server.defineProcedure("getAgent", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}`],
    procedure: async ({ inputs }) => ({
      projectName: inputs.projectName,
      ...(await store.getAgent(inputs.projectName, inputs.agentName)),
    }),
  });

  server.defineProcedure("createAgent", {
    resources: ({ inputs }) => [`project/${inputs.projectName}/agents`],
    procedure: async ({ inputs }) => {
      const { projectName, ...data } = inputs;
      await store.createAgent(projectName, data.name, data);
      return null;
    },
  });

  server.defineProcedure("updateAgent", {
    resources: ({ inputs }) => [
      `project/${inputs.projectName}/agents`,
      `agent/${inputs.projectName}/${inputs.name}`,
    ],
    procedure: async ({ inputs }) => {
      const { projectName, name, ...data } = inputs;
      await store.updateAgent(projectName, name, data);
      return null;
    },
  });

  server.defineProcedure("deleteAgent", {
    resources: ({ inputs }) => [`project/${inputs.projectName}/agents`],
    procedure: async ({ inputs }) => {
      await store.deleteAgent(inputs.projectName, inputs.agentName);
      return null;
    },
  });
}
