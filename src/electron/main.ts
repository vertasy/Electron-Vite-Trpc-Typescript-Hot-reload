import { app, BrowserWindow } from "electron";
import { fork, ChildProcess } from "node:child_process";
import chokidar from "chokidar";
import path from "node:path";

import { registerTrpcIpcListener } from "./trpc.js";

let mainWindow: BrowserWindow | null = null;
let worker: ChildProcess | null = null;
let restartTimeout: NodeJS.Timeout | null = null;

function getWorkerPath() {
  return path.join(process.cwd(), "dist-electron", "backend", "worker.js");
}

function getPreloadPath() {
  return path.join(process.cwd(), "dist-electron", "electron", "preload.cjs");
}

function getUIPath() {
  return path.join(process.cwd(), "dist-react", "index.html");
}

function startWorker() {
  console.log("Starting backend worker");

  worker = fork(getWorkerPath());

  worker.on("exit", (code) => {
    console.log(`Backend worker exited (${code})`);
  });

  worker.on("error", (error) => {
    console.error("Backend worker error:", error);
  });
}

function stopWorker() {
  if (!worker) {
    return;
  }

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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "black",
    webPreferences: {
      preload: getPreloadPath(),
      devTools: true
    }
  });

  if (!app.isPackaged) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(getUIPath());
  }
  // dev
  // production
}

app.whenReady().then(() => {
  createWindow();

  startWorker();

  registerTrpcIpcListener(() => worker);

  chokidar
    .watch(path.join(process.cwd(), "dist-electron", "backend"), {
      ignoreInitial: true
    })
    .on("add", restartWorker)
    .on("change", restartWorker)
    .on("unlink", restartWorker);
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
