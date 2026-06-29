import path from "node:path";

type BackendConfig = {
  localDataDir: string;
  resourcesPath: string;
  isPackaged: boolean;
};

let config: BackendConfig | null = null;

let resolveReady: (() => void) | null = null;

const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function setConfig(newConfig: BackendConfig) {
  config = newConfig;
  resolveReady?.();
}

export async function getConfig() {
  if (!config) {
    await ready;
  }

  return config!;
}

export async function getLocalDataDir() {
  const { isPackaged, localDataDir } = await getConfig();

  return isPackaged ? localDataDir : path.join(process.cwd(), "localData");
}

export async function getResourcesPath() {
  return (await getConfig()).resourcesPath;
}

export async function getIsPackaged() {
  return (await getConfig()).isPackaged;
}
