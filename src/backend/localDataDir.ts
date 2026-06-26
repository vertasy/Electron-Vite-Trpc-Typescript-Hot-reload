let localDataDir: string | null = null;

let resolveReady: (() => void) | null = null;

const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export function setLocalDataDir(dir: string) {
  localDataDir = dir;
  resolveReady?.();
}

export async function getLocalDataDir() {
  if (!localDataDir) {
    await ready;
  }

  return localDataDir!;
}
