import { getResourcesPath } from "../config";
import path from "path";
import { spawn, ChildProcess } from "child_process";

let proc: ChildProcess | null = null;
let ready = false;
let queue: Array<{
  resolve: (val: number[][]) => void;
  reject: (err: Error) => void;
}> = [];
let buffer = "";

export async function initFaceEngine() {
  const resourcesPath = await getResourcesPath();
  const exe = path.join(resourcesPath, "face", "app.exe");

  proc = spawn(exe, [], { stdio: ["pipe", "pipe", "pipe"] });

  proc.stdout!.on("data", (data: Buffer) => {
    buffer += data.toString();

    if (!ready && buffer.includes("PYTHON_READY")) {
      ready = true;
      buffer = "";
      console.log("Face engine ready");
      return;
    }

    if (ready) {
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        const current = queue.shift();
        if (!current) continue;

        try {
          const result = JSON.parse(line);
          if (Array.isArray(result)) {
            current.resolve(result);
          } else if (result.error) {
            current.reject(new Error(result.error));
          }
        } catch (e) {
          current.reject(new Error(`Failed to parse response: ${line}`));
        }
      }
    }
  });

  proc.stderr!.on("data", (data: Buffer) => {
    console.error("Face engine stderr:", data.toString());
  });

  proc.on("close", () => {
    console.log("Face engine closed");
    ready = false;
    proc = null;
  });
}

// Call this once when your app starts
export async function startFaceEngine() {
  await initFaceEngine();
}

// Call this to kill it when app closes
export function stopFaceEngine() {
  proc?.kill();
  proc = null;
  ready = false;
}

// Call this anytime to get embeddings
export function GetImageFaceEmbedding(localPath: string): Promise<number[][]> {
  return new Promise((resolve, reject) => {
    if (!proc || !ready) {
      reject(new Error("Face engine not ready"));
      return;
    }

    queue.push({ resolve, reject });
    proc.stdin!.write(localPath + "\n");
  });
}
