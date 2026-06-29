import { readdir } from "fs/promises";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getLocalDataDir } from "../config.js";

// Matches filenames like "d7b61c78-5cc6-422c-a7e4-a8f2ce50c4b1.sqlite"
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.sqlite$/i;

let currentSqlite: Database.Database | null = null;
let currentDb: ReturnType<typeof drizzle> | null = null;

/**
 * Close the current database connection and clear the singleton.
 * Safe to call even if nothing is open.
 */
export function resetDatabase() {
  if (currentSqlite) {
    currentSqlite.close();
    currentSqlite = null;
    currentDb = null;
  }
}

export async function getDbPath(uuid?: string) {
  const dir = await getLocalDataDir();
  return path.join(dir, uuid ? `${uuid}.sqlite` : "base.sqlite");
}

export async function getDbName(): Promise<string> {
  const dir = await getLocalDataDir();
  const entries = await readdir(dir, { withFileTypes: true });
  const uuidFile = entries.find(
    (entry) => entry.isFile() && UUID_REGEX.test(entry.name)
  );
  return uuidFile ? path.parse(uuidFile.name).name : "base";
}

export async function getDb(uuid?: string) {
  // 🔄 Always release the previous connection before opening a new one
  resetDatabase();

  const dir = await getLocalDataDir();
  let dbFile: string;

  if (uuid) {
    dbFile = `${uuid}.sqlite`;
  } else {
    const entries = await readdir(dir, { withFileTypes: true });
    const uuidFile = entries.find(
      (entry) => entry.isFile() && UUID_REGEX.test(entry.name)
    );
    dbFile = uuidFile ? uuidFile.name : "base.sqlite";
  }

  const dbPath = path.join(dir, dbFile);
  console.log("Opening database:", dbPath);

  currentSqlite = new Database(dbPath);
  currentDb = drizzle(currentSqlite);
  return currentDb;
}
