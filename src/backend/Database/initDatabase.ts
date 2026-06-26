import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { app } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export async function initDatabase() {
  const dataDir = app.isPackaged
    ? app.getPath("userData")
    : path.join(process.cwd(), "localData");

  // Ensure the directory exists
  fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = path.join(dataDir, "base.sqlite");

  console.log("Database:", dbPath);

  // SQLite automatically creates the file if it doesn't exist
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  try {
    console.log("Migrating...");
    migrate(db, {
      migrationsFolder: "./resources/migrations"
    });

    console.log("Database ready");
  } finally {
    sqlite.close();
  }
}
