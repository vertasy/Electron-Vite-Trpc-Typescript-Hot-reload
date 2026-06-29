import { randomBytes } from "crypto";
import {
  AttachmentBuilder,
  Client,
  TextChannel,
  NewsChannel,
  ThreadChannel
} from "discord.js";
import { open } from "fs/promises";
import { basename, extname } from "path";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
export interface ChunkMeta {
  msgId: string;
  attachmentId: string;
  chunkIndex: number;
}

/** Channels guaranteed to have a .send() method */
type SendableChannel = TextChannel | NewsChannel | ThreadChannel;

/** Type guard that ensures the channel exists, is text‑based, and has .send() */
function isSendableChannel(channel: unknown): channel is SendableChannel {
  return (
    channel instanceof TextChannel ||
    channel instanceof NewsChannel ||
    channel instanceof ThreadChannel
  );
}

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNKS_PER_MESSAGE = 2; // 2 chunks per Discord message

// ------------------------------------------------------------------
// Main function
// ------------------------------------------------------------------
export async function uploadDbToDiscord(
  client: Client,
  channelId: string,
  filePath: string,
  fileName?: string,
  version: number = 1
): Promise<ChunkMeta[]> {
  // 1. Resolve the base name for chunk files
  const baseName = fileName ?? basename(filePath, extname(filePath));
  const chunkName = (index: number) => `${baseName}-${index}-${version}.bin`;

  // 2. Fetch the channel
  const channel = await client.channels.fetch(channelId);
  if (!isSendableChannel(channel)) {
    throw new Error(
      "Channel is not a sendable text channel (Text, News, or Thread)."
    );
  }

  // 3. Open the source file (always close it with try/finally)
  const fd = await open(filePath, "r");
  try {
    const stats = await fd.stat();
    const fileSize = stats.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

    console.log(
      `Uploading "${filePath}" (${(fileSize / 1024 / 1024).toFixed(2)} MB) ` +
        `as ${totalChunks} chunks (${CHUNK_SIZE / 1024 / 1024} MB each).`
    );

    // 4. Upload chunks in batches, collecting metadata
    const metadata: ChunkMeta[] = [];
    let batchIndex = 0;

    for (let start = 0; start < totalChunks; start += CHUNKS_PER_MESSAGE) {
      const files: AttachmentBuilder[] = [];
      const indicesInBatch: number[] = [];

      // Prepare up to CHUNKS_PER_MESSAGE attachments
      for (let i = 0; i < CHUNKS_PER_MESSAGE && start + i < totalChunks; i++) {
        const chunkIndex = start + i;
        const buffer = Buffer.alloc(CHUNK_SIZE);
        const { bytesRead } = await fd.read(
          buffer,
          0,
          CHUNK_SIZE,
          chunkIndex * CHUNK_SIZE
        );
        const chunkData = buffer.subarray(0, bytesRead);

        files.push(
          new AttachmentBuilder(chunkData, { name: chunkName(chunkIndex) })
        );
        indicesInBatch.push(chunkIndex);
      }

      console.log(
        `Sending batch ${batchIndex} – chunks [${indicesInBatch.join(", ")}] ...`
      );

      // Unique nonce to avoid duplicate messages on automatic retry
      const nonce = randomBytes(8).toString("hex");
      const msg = await channel.send({ files, nonce });

      console.log(`Batch ${batchIndex} sent – message ID: ${msg.id}`);

      // Map attachment IDs to chunk indices
      for (const [attachId, attachment] of msg.attachments) {
        const match = attachment.name?.match(/^(.+)-(\d+)-(\d+)\.bin$/);
        if (match) {
          const idx = parseInt(match[2], 10);
          metadata.push({
            msgId: msg.id,
            attachmentId: attachId,
            chunkIndex: idx
          });
        } else {
          console.warn(`Unexpected attachment name: ${attachment.name}`);
        }
      }

      batchIndex++;
    }

    console.log(
      `Upload complete. Total messages: ${batchIndex}. Metadata records: ${metadata.length}`
    );

    return metadata;
  } finally {
    await fd.close();
  }
}
