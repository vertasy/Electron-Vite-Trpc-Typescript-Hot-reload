"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTrpcIpcListener = registerTrpcIpcListener;
const electron_1 = require("electron");
const node_crypto_1 = __importDefault(require("node:crypto"));
function registerTrpcIpcListener(getWorker) {
    electron_1.ipcMain.handle("trpc", async (_, payload) => {
        const worker = getWorker();
        return new Promise((resolve, reject) => {
            const id = node_crypto_1.default.randomUUID();
            const listener = (message) => {
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
