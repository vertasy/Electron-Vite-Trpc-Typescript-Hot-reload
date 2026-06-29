import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { fork, ChildProcess } from "node:child_process";
import chokidar from "chokidar";
import path from "node:path";
import fs from "node:fs";
import { registerTrpcIpcListener } from "./trpc.js";
import { initDatabase } from "../backend/Database/initDatabase.js";
import log from "electron-log";
import { lookup } from "mime-types";

let mainWindow: BrowserWindow | null = null;
let worker: ChildProcess | null = null;
let restartTimeout: NodeJS.Timeout | null = null;

//files queue
const BATCH_SIZE = 4;

let uploadQueue: UploadedFile[] = [];
let totalFiles = 0;
let processedFiles = 0;

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

function sendNextBatch() {
  if (!worker) return;

  if (uploadQueue.length === 0) {
    worker.send({
      type: "finish"
    });

    return;
  }

  const batch = uploadQueue.splice(0, BATCH_SIZE);

  worker.send({
    type: "batch",
    files: batch
  });
}

export function startUpload(files: UploadedFile[]) {
  uploadQueue = [...files];
  totalFiles = files.length;
  processedFiles = 0;

  sendNextBatch();
}
function startWorker() {
  console.log("Starting backend worker");
  console.log("Worker:", getWorkerPath());
  worker = fork(getWorkerPath());

  worker.send({
    type: "init",
    config: {
      localDataDir: app.getPath("userData"),
      isPackaged: app.isPackaged,
      resourcesPath: path.join(__dirname, "../../resources")
    }
  });

  worker.on("message", (raw) => {
    const message = raw as WorkerToMainMessage;
    switch (message.type) {
      case "requestBatch":
        processedFiles += message.processed ?? 0;

        mainWindow?.webContents.send("upload:progress", {
          processed: processedFiles,
          total: totalFiles
        });

        sendNextBatch();
        break;

      case "completed":
        mainWindow?.webContents.send("upload:completed");
        break;

      case "error":
        mainWindow?.webContents.send("upload:error", message.error);
        break;
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
    minWidth: 900,
    height: 800,
    minHeight: 560,
    backgroundColor: "#000000",
    webPreferences: {
      preload: getPreloadPath(),
      devTools: true
    }
  });

  mainWindow.webContents.openDevTools();
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
  ipcMain.handle("upload:start", (_, files: UploadedFile[]) => {
    startUpload(files);
  });

  if (app.isPackaged) {
    mainWindow.loadFile(getUIPath());
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }
}

app.whenReady().then(async () => {
  registerTrpcIpcListener(() => worker);
  ipcMain.handle("dialog:openFile", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "SQLite", extensions: ["sqlite"] }]
    });
    if (canceled || filePaths.length === 0) return null;

    const filePath = filePaths[0];
    const name = path.basename(filePath); // cleaner than split/sep
    return { path: filePath, name };
  });
  ipcMain.handle("dialog:openMultipleFiles", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"]
    });

    if (canceled || filePaths.length === 0) {
      return [];
    }

    return filePaths.map((filePath) => ({
      name: path.basename(filePath),
      path: filePath,
      mimeType: lookup(filePath) || "application/octet-stream"
    }));
  });
  try {
    await initDatabase();
    createWindow();
    startWorker();
  } catch (error) {
    console.error(error);
    log.error(error);
  }

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
