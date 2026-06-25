import fs from "fs";
import Database from "better-sqlite3";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb, getDbPath } from "./getDatabasePath";

export function initDatabase() {
  const dbPath = getDbPath();

  const exists = fs.existsSync(dbPath);

  if (!exists) {
    console.log("Creating base.sqlite...");

    const sqlite = new Database(dbPath);

    sqlite.close();
  }

  const db = getDb();

  migrate(db, { migrationsFolder: "./resources/migrations" });

  console.log("Database ready");
}
