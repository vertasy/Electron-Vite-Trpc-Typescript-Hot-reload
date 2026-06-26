import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getLocalDataDir, getIsPackaged } from "../config.js";

export async function getDbPath(uuid?: string) {
  const dir = await getLocalDataDir();

  return path.join(dir, uuid ? `${uuid}.sqlite` : "base.sqlite");
}

export async function getDb(uuid?: string) {
  const dbPath = await getDbPath(uuid);
  const sqlite = new Database(dbPath);

  console.log("Database:", dbPath);
  return drizzle(sqlite);
}
