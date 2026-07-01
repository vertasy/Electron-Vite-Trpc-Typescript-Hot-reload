import { ChildProcess } from "child_process";
import { BrowserWindow } from "electron";

export function setupUploadProgressListener(
  worker: ChildProcess,
  mainWindow: BrowserWindow | null
) {
  worker.on("message", (raw) => {
    const message = raw as any;
    if (message?.type === "fileProgress") {
      mainWindow?.webContents.send("upload:fileProgress", {
        fileName: message.fileName,
        status: message.status
      });
    }
  });
}
