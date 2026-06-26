import { createCaller } from "./trpc.js";
import { setConfig } from "./config.js";

const caller = createCaller({});

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
