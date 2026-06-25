import { app } from "electron";
import path from "path";
import fs from "fs";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

function getLocalDataDir() {
  const dir = !app.isPackaged
    ? path.join(process.cwd(), "localData")
    : app.getPath("userData");

  fs.mkdirSync(dir, {
    recursive: true
  });

  return dir;
}

export function getDbPath(uuid?: string) {
  return path.join(getLocalDataDir(), uuid ? `${uuid}.sqlite` : "base.sqlite");
}

export function getDb(uuid?: string) {
  const sqlite = new Database(getDbPath(uuid));

  return drizzle(sqlite);
}
