import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  shell
} from "electron";
import { fork, ChildProcess } from "node:child_process";
import chokidar from "chokidar";
import path from "node:path";
import fs from "node:fs";
import { registerTrpcIpcListener } from "./trpc.js";
import { initDatabase } from "../backend/Database/initDatabase.js";
import log from "electron-log";
import { lookup } from "mime-types";
import { getDb } from "../backend/Database/getDatabasePath.js";
import { groupsTable } from "../backend/Database/schema/groups.js";
import { v4 as uuid } from "uuid";
import { setupUploadProgressListener } from "./uploadProgress.js";
let mainWindow: BrowserWindow | null = null;
let worker: ChildProcess | null = null;
let restartTimeout: NodeJS.Timeout | null = null;

//files queue
const BATCH_SIZE = 4;

let uploadQueue: UploadedFile[] = [];
let totalFiles = 0;
let processedFiles = 0;
let currentGroupId: string | null = null;

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
  if (!worker || !currentGroupId) return;

  if (uploadQueue.length === 0) {
    worker.send({
      type: "finish",
      groupId: currentGroupId
    });

    return;
  }

  const batch = uploadQueue.splice(0, BATCH_SIZE);

  worker.send({
    type: "batch",
    groupId: currentGroupId,
    files: batch
  });
}

export async function startUpload(files: UploadedFile[]) {
  uploadQueue = [...files];
  totalFiles = files.length;
  processedFiles = 0;

  try {
    currentGroupId = uuid();
    sendNextBatch();
  } catch (error) {
    console.error(error);
    log.error(error);
  }
}
async function startWorker() {
  console.log("Starting backend worker");
  console.log("Worker:", getWorkerPath());
  worker = fork(getWorkerPath());

  worker.send({
    type: "init",
    config: {
      localDataDir: app.getPath("userData"),
      isPackaged: app.isPackaged,
      resourcesPath: app.isPackaged
        ? process.resourcesPath
        : path.join(process.cwd(), "resources")
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
        uploadQueue = [];
        totalFiles = 0;
        processedFiles = 0;
        currentGroupId = null;
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
  protocol.handle("local", (request) => {
    console.log(request.url);

    const filePath = decodeURIComponent(request.url.replace("local://", ""));

    console.log(filePath);

    return net.fetch(`file://${filePath}`);
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
    await startWorker();
    setupUploadProgressListener(worker!, mainWindow);
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
