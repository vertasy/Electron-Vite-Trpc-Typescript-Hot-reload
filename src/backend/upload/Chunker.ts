import { createReadStream } from "fs";
import { Readable, Transform } from "stream";
import { pipeline } from "stream/promises";

import { EncryptTransform } from "./transformer";
import { Writable } from "stream";
import { ChunkQueue } from "./ChunksQueue";
import { getDb } from "../Database/getDatabasePath";
import { metadataTable } from "../Database/schema/metadata";
import { decryptPin } from "../Router/start/code";
import { QUEUE } from "../worker";

const CHUNK_SIZE = 1024 * 1024 * 10; // 1 MB

export default async function LocalFilesChunker(
  path: string,
  fileId: string,
  isEncrypted: boolean,
  ext: string,
  totalChunks: number
) {
  console.log("LocalFilesChunker", path, fileId, isEncrypted);
  const db = await getDb();
  const metadata = await db.select().from(metadataTable).limit(1).all();

  const pin = decryptPin(metadata[0].hashedCode!);

  let chunkIndex = 0;
  let buffer = Buffer.alloc(0);

  const chunker = new Writable({
    write(chunk: Buffer, _, callback) {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= CHUNK_SIZE) {
        const piece = buffer.subarray(0, CHUNK_SIZE);

        void QUEUE.enqueue({
          fileId,
          chunkIndex: chunkIndex++,
          chunkSize: piece.length,
          totalChunks: totalChunks,
          ext,
          isEncrypted,
          data: Buffer.from(piece)
        });

        buffer = buffer.subarray(CHUNK_SIZE);
      }

      callback();
    },

    final(callback) {
      if (buffer.length > 0) {
        void QUEUE.enqueue({
          fileId,
          chunkIndex: chunkIndex++,
          chunkSize: buffer.length,
          totalChunks,
          ext,
          isEncrypted,
          data: Buffer.from(buffer)
        });
      }

      callback();
    }
  });

  await pipeline(
    createReadStream(path),
    ...(isEncrypted ? [new EncryptTransform(pin)] : []),
    chunker
  );
}

export async function RawFilesChunker(
  data: Uint8Array | (Record<number, number> & { length: number }),
  fileId: string,
  isEncrypted: boolean,
  ext: string,
  totalChunks: number
) {
  console.log("RawFilesChunker", fileId, isEncrypted);
  const db = await getDb();
  const metadata = await db.select().from(metadataTable).limit(1).all();

  const pin = decryptPin(metadata[0].hashedCode!);

  // Ensure data is a real Uint8Array (it might be a serialized object)
  const uint8: Uint8Array =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(Object.values(data as Record<number, number>));

  let chunkIndex = 0;
  let buffer = Buffer.alloc(0);

  const chunker = new Writable({
    write(chunk: Buffer, _, callback) {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= CHUNK_SIZE) {
        const piece = buffer.subarray(0, CHUNK_SIZE);

        void QUEUE.enqueue({
          fileId,
          chunkIndex: chunkIndex++,
          chunkSize: piece.length,
          totalChunks,
          ext,
          isEncrypted,
          data: Buffer.from(piece)
        });

        buffer = buffer.subarray(CHUNK_SIZE);
      }

      callback();
    },

    final(callback) {
      if (buffer.length > 0) {
        void QUEUE.enqueue({
          fileId,
          chunkIndex: chunkIndex++,
          chunkSize: buffer.length,
          totalChunks,
          ext,
          isEncrypted,
          data: Buffer.from(buffer)
        });
      }

      callback();
    }
  });

  // Create a Readable stream from the Uint8Array’s underlying ArrayBuffer
  const readable = Readable.from(
    Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength)
  );

  await pipeline(
    readable,
    ...(isEncrypted ? [new EncryptTransform(pin)] : []),
    chunker
  );
}
