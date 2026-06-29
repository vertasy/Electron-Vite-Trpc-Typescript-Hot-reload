import { getLocalDataDir } from "../../config";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { TRPCError } from "@trpc/server";

// Regex to match a standard UUID filename (v4 or any variant) ending with .sqlite
const UUID_SQLITE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.sqlite$/i;

export default async function UploadDbRestore(
  sourcePath: string
): Promise<string> {
  try {
    const localDir = await getLocalDataDir();
    await fs.mkdir(localDir, { recursive: true });

    // Build new filename
    const ext = path.extname(sourcePath); // .sqlite
    const newName = `${uuidv4()}${ext}`;
    const destPath = path.join(localDir, newName);

    // 1. Copy the new file FIRST
    await fs.copyFile(sourcePath, destPath);

    // 2. Cleanup: remove any older UUID-named .sqlite files (except the new one)
    const files = await fs.readdir(localDir);
    const deletePromises = files
      .filter((file) => UUID_SQLITE_REGEX.test(file)) // only UUID-named .sqlite
      .filter((file) => file !== newName) // skip the one just created
      .map((file) => fs.unlink(path.join(localDir, file)));

    await Promise.all(deletePromises);

    return destPath;
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}
