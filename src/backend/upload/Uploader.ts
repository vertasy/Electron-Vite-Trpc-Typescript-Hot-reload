import { stat } from "node:fs/promises";
import { getBetterDb, getDb } from "../Database/getDatabasePath";
import { filesTable } from "../Database/schema/files";
import { v4 as uuid } from "uuid";
import { groupsTable } from "../Database/schema/groups";
import * as sqliteVec from "sqlite-vec";
import { ChunkQueue } from "./ChunksQueue";
import LocalFilesChunker, { RawFilesChunker } from "./Chunker";
import { QUEUE } from "../worker";
const chunkSizeInBytes = 10 * 1024 * 1024; //

async function insertGroupId(id: string) {
  try {
    const db = await getDb();

    await db.insert(groupsTable).values({ id }).onConflictDoNothing();

    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export default async function ProcessFiles(
  files: UploadedFile[],
  groupId: string
) {
  console.log("process files batch", files.length, groupId);

  await insertGroupId(groupId);
  const isEncrypted = false;
  // getting 4 files finish them till the end
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (file.type === "local") {
      await LocalFilesHandler(file, isEncrypted, groupId);
    } else if (file.type === "raw") {
      await RawFilesHandler(file, isEncrypted, groupId, file.data);
    } else if (file.type === "url") {
      await UrlFilesHandler(file, isEncrypted, groupId);
    }
  }
  console.log(
    `[PROCESS] Finished all files, queue length: ${(QUEUE as any).jobs.length}`
  );
}

export function UrlFilesHandler(
  file: UploadedFile,
  isEncrypted: boolean,
  groupId: string
) {}

async function RawFilesHandler(
  file: UploadedFile,
  isEncrypted: boolean,
  groupId: string,
  data?: Uint8Array
) {
  if (file.type !== "raw") return null;
  const size = data?.byteLength ?? 0;
  const ext = file.mimeType.split("/").pop();
  const db = await getDb();
  const id = uuid();
  if (file.mimeType.startsWith("image/")) {
    const imageRec = await db
      .insert(filesTable)
      .values({
        id,
        groupId: groupId,
        type: "image",
        name: file.name || `untitled-${id}`,
        mimeType: file.mimeType,
        size: size,
        isEncrypted: isEncrypted ? 1 : 0,
        ChunkCount: Math.ceil(size / chunkSizeInBytes)
      })
      .returning();
  }
  console.log(file);
  const totalChunks = Math.ceil(size / chunkSizeInBytes);
  await RawFilesChunker(data!, id, isEncrypted, ext!, totalChunks);
}

async function LocalFilesHandler(
  file: UploadedFile,
  isEncrypted: boolean,
  groupId: string
) {
  if (file.type !== "local") return null;
  const { size } = await stat(file.path);
  const ext = file.path.split(".").pop();
  const db = await getDb();
  const id = uuid();
  if (file.mimeType.startsWith("image/")) {
    const imageRec = await db
      .insert(filesTable)
      .values({
        id,
        groupId: groupId,
        type: "image",
        name: file.name || `untitled-${id}`,
        mimeType: file.mimeType,
        size: size,
        isEncrypted: isEncrypted ? 1 : 0,
        ChunkCount: Math.ceil(size / chunkSizeInBytes)
      })
      .returning();
  } else if (file.mimeType.startsWith("audio/")) {
    const audioRec = await db
      .insert(filesTable)
      .values({
        id,
        groupId: groupId,
        type: "audio",
        name: file.name || `untitled-${id}`,
        mimeType: file.mimeType,
        size: size,
        isEncrypted: isEncrypted ? 1 : 0,
        ChunkCount: Math.ceil(size / chunkSizeInBytes)
      })
      .returning();
  } else if (file.mimeType.startsWith("video/")) {
    const videoRec = await db
      .insert(filesTable)
      .values({
        id,
        groupId: groupId,
        type: "video",
        name: file.name || `untitled-${id}`,
        mimeType: file.mimeType,
        size: size,
        isEncrypted: isEncrypted ? 1 : 0,
        ChunkCount: Math.ceil(size / chunkSizeInBytes)
      })
      .returning();
  } else {
    // doc
    const docRec = await db
      .insert(filesTable)
      .values({
        id,
        groupId: groupId,
        type: "document",
        name: file.name || `untitled-${id}`,
        mimeType: file.mimeType,
        size: size,
        isEncrypted: isEncrypted ? 1 : 0,
        ChunkCount: Math.ceil(size / chunkSizeInBytes)
      })
      .returning();
  }
  const totalChunks = Math.ceil(size / chunkSizeInBytes);
  await LocalFilesChunker(file.path, id, isEncrypted, ext!, totalChunks);
}

/**
 * Extensions that typically indicate a direct downloadable file.
 * Extend or trim this set as needed.
 */
const DOWNLOADABLE_EXTENSIONS: ReadonlySet<string> = new Set([
  // Video
  "mp4",
  "webm",
  "mkv",
  "mov",
  "avi",
  "flv",
  "wmv",
  "m4v",
  // Audio
  "mp3",
  "aac",
  "flac",
  "wav",
  "ogg",
  "m4a",
  "opus",
  // Images
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "webp",
  "svg",
  "ico",
  // Documents
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  // Archives
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "bz2",
  "xz",
  // Executables / disk images
  "exe",
  "dmg",
  "apk",
  "iso",
  // Streaming segments (optional — remove if you don't want them)
  "m3u8",
  "ts"
]);

const WEBPAGE_EXTENSIONS: ReadonlySet<string> = new Set([
  "html",
  "htm",
  "php",
  "asp",
  "aspx",
  "jsp",
  "cgi",
  "xml",
  "json",
  "js",
  "css"
]);

/**
 * Fast, zero-network check: returns `true` if the URL likely points
 * to a direct downloadable file (based solely on its path extension).
 *
 * @param url - Any absolute URL string.
 * @returns `true` for direct file links, `false` for webpages, APIs, etc.
 */
function isDirect(url: string): boolean {
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return false; // invalid URL
  }

  if (!pathname || pathname === "/") return false;

  // Grab the last segment (the filename)
  const segments = pathname.split("/");
  const filename = segments[segments.length - 1];
  if (!filename) return false;

  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) return false; // no extension

  const ext = filename.slice(dotIndex + 1).toLowerCase();

  // Explicitly exclude known webpage / script extensions
  if (WEBPAGE_EXTENSIONS.has(ext)) return false;

  return DOWNLOADABLE_EXTENSIONS.has(ext);
}
