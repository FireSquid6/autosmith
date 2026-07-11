import path from "path"; 
import fs from "fs";
import type { BridgeConfig } from "../config";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";



export function getDb(config: BridgeConfig) {
  const databasePath = path.join(config.dataDirectory, "bridge.sqlite"); 
  fs.mkdirSync(config.dataDirectory);

  const sqlite = config.ephemeralDb === true 
    ? new Database(":memory:") 
    : new Database(databasePath);

  return drizzle(sqlite);
}

export type Db = ReturnType<typeof getDb>;

