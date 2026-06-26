import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { app } from "electron";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import log from "electron-log";
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
  const migrationsFolder = app.isPackaged
    ? path.join(process.resourcesPath, "migrations")
    : path.join(process.cwd(), "resources", "migrations");
  try {
    log.info(`MIGRATIONS FOLDER`, migrationsFolder);
    console.log(`MIGRATIONS FOLDER`, migrationsFolder);
    console.log("Migrating...");
    migrate(db, {
      migrationsFolder: migrationsFolder
    });

    console.log("Database ready");
  } finally {
    sqlite.close();
  }
}
