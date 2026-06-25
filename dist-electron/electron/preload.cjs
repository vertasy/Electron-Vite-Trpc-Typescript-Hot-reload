"use strict";
// preload.ts
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
    sendTrpcEvent: (param) => electron_1.ipcRenderer.invoke("trpc", param)
});
