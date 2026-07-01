// preload.ts

import { ipcRenderer } from "electron";
const electron = require("electron");
const { webUtils } = require("electron");
import { shell } from "electron";

electron.contextBridge.exposeInMainWorld("electron", {
  sendTrpcEvent: (param: TrpcEvent) => ipcRenderer.invoke("trpc", param),
  getPathForFile: (file: File) => webUtils.getPathForFile(file),
  openFileDialog: () => ipcRenderer.invoke("dialog:openFile"),
  openMultipleFileDialog: () => ipcRenderer.invoke("dialog:openMultipleFiles"),
  openExternal: (url: string) => shell.openExternal(url),
  startUpload: (files: UploadedFile[]) =>
    ipcRenderer.invoke("upload:start", files),
  onUploadFileProgress: (
    callback: (data: { fileName: string; status: string }) => void
  ) => {
    ipcRenderer.on("upload:fileProgress", (_event, data) => callback(data));
  }
});
