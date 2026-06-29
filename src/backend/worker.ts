import { createCaller } from "./trpc.js";
import { setConfig } from "./config.js";
import { initFaceEngine } from "./face/face.js";

const caller = createCaller({});

async function processFiles(files: UploadedFile[]) {
  console.log("Bakcend worker Processing", files.length, "files...");

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 10_000); // 10 seconds
  });

  console.log("Finished processing", files.length, "files.");
}

process.on("message", async (raw) => {
  const message = raw as MainToWorkerMessage;

  switch (message.type) {
    case "init":
      await initFaceEngine();
      setConfig(message.config);
      break;

    case "batch":
      await processFiles(message.files);

      process.send?.({
        type: "requestBatch",
        processed: message.files.length
      });
      break;

    case "finish":
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
