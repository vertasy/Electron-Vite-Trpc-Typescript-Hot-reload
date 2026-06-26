import { app, BrowserWindow } from "electron";
import { fork, ChildProcess } from "node:child_process";
import chokidar from "chokidar";
import path from "node:path";
import fs from "node:fs";
import { registerTrpcIpcListener } from "./trpc.js";
import { initDatabase } from "../backend/Database/initDatabase.js";

let mainWindow: BrowserWindow | null = null;
let worker: ChildProcess | null = null;
let restartTimeout: NodeJS.Timeout | null = null;

function getAppRoot() {
  return app.isPackaged ? app.getAppPath() : process.cwd();
}

function getWorkerPath() {
  return path.join(getAppRoot(), "dist-electron", "backend", "worker.js");
}

function getPreloadPath() {
  return path.join(getAppRoot(), "dist-electron", "electron", "preload.cjs");
}

function getUIPath() {
  return path.join(getAppRoot(), "dist-react", "index.html");
}

function startWorker() {
  console.log("Starting backend worker");
  console.log("Worker:", getWorkerPath());
  worker = fork(getWorkerPath());
  worker.send({
    type: "init",
    config: {
      localDataDir: app.getPath("userData"),
      isPackaged: app.isPackaged
    }
  });
  worker.on("exit", (code) => {
    console.log(`Backend worker exited (${code})`);
  });

  worker.on("error", (error) => {
    console.error("Backend worker error:", error);
  });
}

function stopWorker() {
  if (!worker) return;

  worker.kill();
  worker = null;
}

function restartWorker() {
  if (restartTimeout) {
    clearTimeout(restartTimeout);
  }

  restartTimeout = setTimeout(() => {
    console.log("Restarting backend worker");

    stopWorker();
    startWorker();
  }, 100);
}

function createWindow() {
  console.log("App Root:", getAppRoot());
  console.log("Preload:", getPreloadPath());
  console.log("UI:", getUIPath());

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#000000",
    webPreferences: {
      preload: getPreloadPath(),
      devTools: true
    }
  });

  mainWindow.webContents.openDevTools();
  if (app.isPackaged) {
    mainWindow.loadFile(getUIPath());
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(async () => {
  createWindow();

  startWorker();
  registerTrpcIpcListener(() => worker);
  await initDatabase();

  if (!app.isPackaged) {
    chokidar
      .watch(path.join(process.cwd(), "dist-electron", "backend"), {
        ignoreInitial: true
      })
      .on("add", restartWorker)
      .on("change", restartWorker)
      .on("unlink", restartWorker);
  }
});

app.on("before-quit", () => {
  stopWorker();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
