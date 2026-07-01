import { createCaller } from "./trpc.js";
import { setConfig } from "./config.js";
import ProcessFiles from "./upload/Uploader.js";
import { ChunkQueue } from "./upload/ChunksQueue.js";

const caller = createCaller({});
export const QUEUE = new ChunkQueue(4);
process.on("message", async (raw) => {
  const message = raw as MainToWorkerMessage;

  switch (message.type) {
    case "init":
      setConfig(message.config);
      break;

    case "batch":
      await ProcessFiles(message.files, message.groupId);

      process.send?.({
        type: "requestBatch",
        processed: message.files.length
      });
      break;

    case "finish":
      await QUEUE.flush();
      process.send?.({
        type: "completed"
      });
      break;
  }
});

process.on("message", async (message: any) => {
  if (message.type === "init") {
    setConfig(message.config);
    return;
  }

  try {
    const fn = (caller as any)[message.payload.procedureName];

    const result = await fn(JSON.parse(message.payload.data));

    process.send?.({
      id: message.id,
      result
    });
  } catch (error) {
    process.send?.({
      id: message.id,
      error: String(error)
    });
  }
});
