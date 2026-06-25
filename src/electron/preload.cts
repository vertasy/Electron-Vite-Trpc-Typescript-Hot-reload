// preload.ts

import { ipcRenderer } from "electron";
const electron = require("electron");

electron.contextBridge.exposeInMainWorld("electron", {
  sendTrpcEvent: (param: TrpcEvent) => ipcRenderer.invoke("trpc", param)
});
