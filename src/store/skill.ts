import matter from "gray-matter";
import { join, resolve } from "node:path";
import { readdir } from "node:fs/promises";

export interface Skill {
  name: string;
  title: string;
  description: string;
  // Body of SKILL.md after the frontmatter block
  content: string;
  // Absolute path to the skill directory
  dir: string;
}

export class SkillStore {
  readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  async list(): Promise<string[]> {
    const entries = await readdir(this.dir, { withFileTypes: true }).catch(() => []);
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  }

  async get(name: string): Promise<Skill> {
    const dir = join(this.dir, name);
    const raw = await Bun.file(join(dir, "SKILL.md")).text();
    const { data, content } = matter(raw);
    return {
      name,
      title: String(data.title ?? name),
      description: String(data.description ?? ""),
      content: content.trim(),
      dir,
    };
  }

  async readFile(skillName: string, path: string): Promise<string> {
    const skillDir = resolve(join(this.dir, skillName));
    const target = resolve(join(skillDir, path));
    if (!target.startsWith(skillDir + "/")) {
      throw new Error(`Path "${path}" escapes the skill directory`);
    }
    return Bun.file(target).text();
  }
}
