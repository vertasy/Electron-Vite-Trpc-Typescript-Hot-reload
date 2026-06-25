"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const chokidar_1 = __importDefault(require("chokidar"));
const node_path_1 = __importDefault(require("node:path"));
const trpc_js_1 = require("./trpc.js");
let mainWindow = null;
let worker = null;
let restartTimeout = null;
function getWorkerPath() {
    return node_path_1.default.join(process.cwd(), "dist-electron", "backend", "worker.js");
}
function getPreloadPath() {
    return node_path_1.default.join(process.cwd(), "dist-electron", "electron", "preload.cjs");
}
function startWorker() {
    console.log("Starting backend worker");
    worker = (0, node_child_process_1.fork)(getWorkerPath());
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
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: "black",
        webPreferences: {
            preload: getPreloadPath(),
            devTools: true
        }
    });
    // dev
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
    // production
    // mainWindow.loadFile(...)
}
electron_1.app.whenReady().then(() => {
    createWindow();
    startWorker();
    (0, trpc_js_1.registerTrpcIpcListener)(() => worker);
    chokidar_1.default
        .watch(node_path_1.default.join(process.cwd(), "dist-electron", "backend"), {
        ignoreInitial: true
    })
        .on("add", restartWorker)
        .on("change", restartWorker)
        .on("unlink", restartWorker);
});
electron_1.app.on("before-quit", () => {
    stopWorker();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
