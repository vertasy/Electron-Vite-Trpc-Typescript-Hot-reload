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
  onUploadProgress: (
    callback: (progress: { processed: number; total: number }) => void
  ) =>
    ipcRenderer.on(
      "upload:progress",
      (_, progress: { processed: number; total: number }) => {
        callback(progress);
      }
    )
});
