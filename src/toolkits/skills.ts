import { tool } from "ai";
import { z } from "zod";
import type { SkillStore } from "../store/skill";

export function getToolkitFromSkills(store: SkillStore, assignedSkills: string[]) {
  const allowed = new Set(assignedSkills);

  function assertAllowed(name: string) {
    if (!allowed.has(name)) {
      throw new Error(`Skill "${name}" is not assigned to this agent`);
    }
  }

  return {
    skillRead: tool({
      description:
        "Read the full instructions from a skill's SKILL.md. Use this to load a skill's detailed guidance into your context before applying it.",
      inputSchema: z.object({
        name: z.string().describe("Name of the skill"),
      }),
      execute: async ({ name }) => {
        assertAllowed(name);
        const skill = await store.get(name);
        return skill.content;
      },
    }),

    skillReadFile: tool({
      description:
        "Read a file from within a skill's directory (e.g. scripts/, reference/, assets/).",
      inputSchema: z.object({
        skill: z.string().describe("Name of the skill"),
        path: z.string().describe("Path relative to the skill directory"),
      }),
      execute: async ({ skill, path }) => {
        assertAllowed(skill);
        return store.readFile(skill, path);
      },
    }),
  };
}
