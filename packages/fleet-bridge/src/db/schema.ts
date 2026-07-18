import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";


export const shipsTable = sqliteTable("ship", {
  name: text("name").primaryKey(),
  url: text("url").notNull()
});

export type SelectShip = InferSelectModel<typeof shipsTable>;
export type InsertShip = InferInsertModel<typeof shipsTable>;


export const reposTable = sqliteTable("repos", {
  name: text("name").primaryKey(),
  url: text("url").notNull(),
  provider: text("provider").notNull(),
});


export type SelectRepo = InferSelectModel<typeof reposTable>;
export type InsertRepo = InferInsertModel<typeof reposTable>;

