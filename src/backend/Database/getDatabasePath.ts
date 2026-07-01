import { readdir } from "fs/promises";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getLocalDataDir } from "../config.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.sqlite$/i;

let currentSqlite: Database.Database | null = null;
let currentDb: ReturnType<typeof drizzle> | null = null;
let currentDbName: string | null = null;
export function resetDatabase() {
  if (currentSqlite) {
    currentSqlite.close();
    currentSqlite = null;
    currentDb = null;
  }
}

async function openDatabase(uuid?: string) {
  // console.log("Opening database...");

  // Always close the previous connection
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
  currentDbName = dbFile; // ✅ store it here
  const dbPath = path.join(dir, dbFile);
  console.log("Opening database:", dbPath);

  currentSqlite = new Database(dbPath);
  currentDb = drizzle(currentSqlite);

  return { sqlite: currentSqlite, drizzle: currentDb };
}

export async function getDb(uuid?: string) {
  const { drizzle } = await openDatabase(uuid);
  return drizzle;
}

export async function getBetterDb(uuid?: string): Promise<Database.Database> {
  const { sqlite } = await openDatabase(uuid);
  return sqlite;
}

export function getDbName() {
  return currentDbName;
}
