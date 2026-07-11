import { eq } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../db/schema";

export class ProjectRepoService {
  constructor(private db: Db) {}

  async getAllRepos(): Promise<schema.SelectRepo[]> {
    return await this.db
      .select()
      .from(schema.reposTable)
  }

  async getRepo(name: string): Promise<schema.SelectRepo | undefined> {
    const [repo] = await this.db
      .select()
      .from(schema.reposTable)
      .where(eq(schema.reposTable.name, name))
      .limit(1)

    return repo
  }

  async createRepo(repo: schema.InsertRepo): Promise<schema.SelectRepo> {
    const [created] = await this.db
      .insert(schema.reposTable)
      .values(repo)
      .returning()

    return created!
  }

  /** Insert a repo, or overwrite its `url`/`provider` if the name already exists. */
  async upsertRepo(repo: schema.InsertRepo): Promise<schema.SelectRepo> {
    const [upserted] = await this.db
      .insert(schema.reposTable)
      .values(repo)
      .onConflictDoUpdate({
        target: schema.reposTable.name,
        set: { url: repo.url, provider: repo.provider },
      })
      .returning()

    return upserted!
  }

  async updateRepo(
    name: string,
    values: Partial<Omit<schema.InsertRepo, "name">>,
  ): Promise<schema.SelectRepo | undefined> {
    const [updated] = await this.db
      .update(schema.reposTable)
      .set(values)
      .where(eq(schema.reposTable.name, name))
      .returning()

    return updated
  }

  async deleteRepo(name: string): Promise<schema.SelectRepo | undefined> {
    const [deleted] = await this.db
      .delete(schema.reposTable)
      .where(eq(schema.reposTable.name, name))
      .returning()

    return deleted
  }
}
