import type { AppServer } from "../server-types";
import type { AutosmithStore } from "../../store";

export function registerContentProcedures(server: AppServer, store: AutosmithStore) {
  server.defineProcedure("getProjectInstructions", {
    resources: ({ inputs }) => [`project/${inputs.projectName}/instructions`],
    procedure: ({ inputs }) => store.getProjectInstructions(inputs.projectName),
  });

  server.defineProcedure("getAgentInstructions", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/instructions`],
    procedure: ({ inputs }) => store.getAgentInstructions(inputs.projectName, inputs.agentName),
  });

  server.defineProcedure("getAgentTokens", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/tokens`],
    procedure: ({ inputs }) =>
      store.getLayeredAgentTokens(inputs.projectName, inputs.agentName),
  });

  server.defineProcedure("getAgentSkills", {
    resources: ({ inputs }) => [`agent/${inputs.projectName}/${inputs.agentName}/skills`],
    procedure: async ({ inputs }) => {
      const agentConfig = await store.getAgent(inputs.projectName, inputs.agentName);
      return Promise.all(agentConfig.skills.map(name => store.skills.get(name)));
    },
  });
}
