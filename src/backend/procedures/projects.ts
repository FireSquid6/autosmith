import type { AppServer } from "../server-types";
import type { AutosmithStore } from "../../store";

export function registerProjectProcedures(server: AppServer, store: AutosmithStore) {
  server.defineProcedure("listProjects", {
    resources: () => ["projects"],
    procedure: async () => {
      const names = await store.listProjects();
      return Promise.all(
        names.map(async name => ({ name, ...(await store.getProject(name)) })),
      );
    },
  });

  server.defineProcedure("getProject", {
    resources: ({ inputs }) => [`project/${inputs.name}`],
    procedure: async ({ inputs }) => ({
      name: inputs.name,
      ...(await store.getProject(inputs.name)),
    }),
  });

  server.defineProcedure("createProject", {
    resources: () => ["projects"],
    procedure: async ({ inputs }) => {
      const { name, ...data } = inputs;
      await store.createProject(name, data);
      return null;
    },
  });

  server.defineProcedure("updateProject", {
    resources: ({ inputs }) => ["projects", `project/${inputs.name}`],
    procedure: async ({ inputs }) => {
      const { name, ...data } = inputs;
      await store.updateProject(name, data);
      return null;
    },
  });

  server.defineProcedure("deleteProject", {
    resources: () => ["projects"],
    procedure: async ({ inputs }) => {
      await store.deleteProject(inputs.name);
      return null;
    },
  });
}
