import { eq } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../db/schema";

export class ShipService {
  constructor(private db: Db) {}

  async getAllShips(): Promise<schema.SelectShip[]> {
    return await this.db
      .select()
      .from(schema.shipsTable)
  }

  async getShip(name: string): Promise<schema.SelectShip | undefined> {
    const [ship] = await this.db
      .select()
      .from(schema.shipsTable)
      .where(eq(schema.shipsTable.name, name))
      .limit(1)

    return ship
  }

  async createShip(ship: schema.InsertShip): Promise<schema.SelectShip> {
    const [created] = await this.db
      .insert(schema.shipsTable)
      .values(ship)
      .returning()

    return created!
  }

  /** Insert a ship, or overwrite its `url` if the name already exists. */
  async upsertShip(ship: schema.InsertShip): Promise<schema.SelectShip> {
    const [upserted] = await this.db
      .insert(schema.shipsTable)
      .values(ship)
      .onConflictDoUpdate({
        target: schema.shipsTable.name,
        set: { url: ship.url },
      })
      .returning()

    return upserted!
  }

  async updateShip(
    name: string,
    values: Partial<Omit<schema.InsertShip, "name">>,
  ): Promise<schema.SelectShip | undefined> {
    const [updated] = await this.db
      .update(schema.shipsTable)
      .set(values)
      .where(eq(schema.shipsTable.name, name))
      .returning()

    return updated
  }

  async deleteShip(name: string): Promise<schema.SelectShip | undefined> {
    const [deleted] = await this.db
      .delete(schema.shipsTable)
      .where(eq(schema.shipsTable.name, name))
      .returning()

    return deleted
  }
}
