import { ipcMain } from "electron";
import crypto from "node:crypto";

export function registerTrpcIpcListener(getWorker: () => any) {
  ipcMain.handle("trpc", async (_, payload) => {
    const worker = getWorker();

    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();

      const listener = (message: any) => {
        if (message.id !== id) {
          return;
        }

        worker.off("message", listener);

        if (message.error) {
          reject(message.error);
          return;
        }

        resolve(message.result);
      };

      worker.on("message", listener);

      worker.send({
        id,
        payload
      });
    });
  });
}
