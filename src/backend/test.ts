import { AttachmentBuilder, Client, Message, TextChannel } from "discord.js";
import { createWriteStream, createReadStream } from "fs";
import { mkdir, stat, open, writeFile, rm } from "fs/promises";
import { once } from "events";
import { join } from "path";
import { DiscordClient } from "./Discord/connect";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CHANNEL_ID = "1519885793802588320";
const TEMP_DIR = join(process.cwd(), "temp");

const BIG_FILE_SIZE = 300 * 1024 * 1024; // 300 MB
const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const CHUNKS_PER_MESSAGE = 2; // upload 2 chunks per message

const FILL_CHUNK = Buffer.alloc(64 * 1024, "A");

// ---------------------------------------------------------------------------
// Helper: generate a 300 MB dummy file (named source.sqlite)
// ---------------------------------------------------------------------------
async function generateBigFile(filePath: string): Promise<void> {
  const stream = createWriteStream(filePath);
  let written = 0;
  while (written < BIG_FILE_SIZE) {
    const size = Math.min(FILL_CHUNK.length, BIG_FILE_SIZE - written);
    if (!stream.write(FILL_CHUNK.subarray(0, size))) {
      await once(stream, "drain");
    }
    written += size;
  }
  stream.end();
  await once(stream, "finish");
  const info = await stat(filePath);
  console.log(
    `Generated ${filePath} (${(info.size / 1024 / 1024).toFixed(2)} MB)`
  );
}

// ---------------------------------------------------------------------------
// Chunk upload metadata type
// ---------------------------------------------------------------------------
export interface ChunkMeta {
  msgId: string;
  attachmentId: string;
  chunkIndex: number;
}

// ---------------------------------------------------------------------------
// Upload a 300 MB file in 10 MB chunks, returning metadata for reassembly
// ---------------------------------------------------------------------------
export async function testUpload(client: Client): Promise<ChunkMeta[]> {
  console.log("=== testUpload started ===");

  await mkdir(TEMP_DIR, { recursive: true });

  const sourcePath = join(TEMP_DIR, "source.sqlite");
  console.log("Generating 300 MB source file...");
  await generateBigFile(sourcePath);

  const fd = await open(sourcePath, "r");
  const totalChunks = Math.ceil(BIG_FILE_SIZE / CHUNK_SIZE);

  const channel = await client.channels.fetch(CHANNEL_ID);
  if (!channel?.isTextBased() || !("send" in channel)) {
    throw new Error("Channel is not sendable.");
  }
  const textChannel = channel as TextChannel;

  const metadata: ChunkMeta[] = [];
  let batchIndex = 0;

  for (let start = 0; start < totalChunks; start += CHUNKS_PER_MESSAGE) {
    const files: AttachmentBuilder[] = [];
    const indicesInBatch: number[] = [];

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
        new AttachmentBuilder(chunkData, { name: `chunk_${chunkIndex}.bin` })
      );
      indicesInBatch.push(chunkIndex);
    }

    console.log(
      `Sending batch ${batchIndex} – chunks [${indicesInBatch.join(", ")}] ...`
    );

    const started = Date.now();
    const msg: Message<true> = await textChannel.send({
      content: `Chunk batch ${batchIndex}`,
      files
    });

    console.log(
      `Batch ${batchIndex} sent in ${((Date.now() - started) / 1000).toFixed(2)}s – message ID: ${msg.id}`
    );

    for (const [attachId, attachment] of msg.attachments) {
      const match = attachment.name?.match(/^chunk_(\d+)\.bin$/);
      if (match) {
        const idx = parseInt(match[1], 10);
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

  await fd.close();
  console.log(
    `Upload complete. Total messages: ${batchIndex}. Metadata records: ${metadata.length}`
  );
  return metadata;
}

// ---------------------------------------------------------------------------
// Reassemble the original file from the uploaded chunks
// ---------------------------------------------------------------------------
export async function reconstructFile(
  client: Client,
  metadata: ChunkMeta[],
  outputPath: string
): Promise<void> {
  console.log("=== Reconstructing file from chunks ===");

  const sorted = [...metadata].sort((a, b) => a.chunkIndex - b.chunkIndex);
  const tempDir = join(TEMP_DIR, "reconstruct_chunks");
  await mkdir(tempDir, { recursive: true });

  for (const chunk of sorted) {
    const tempFilePath = join(tempDir, `chunk_${chunk.chunkIndex}.tmp`);
    console.log(
      `Downloading chunk ${chunk.chunkIndex} from msg ${chunk.msgId}...`
    );

    const channel = (await client.channels.fetch(CHANNEL_ID)) as TextChannel;
    const message = await channel.messages.fetch(chunk.msgId);

    const attachment = message.attachments.get(chunk.attachmentId);
    if (!attachment) {
      throw new Error(
        `Attachment ${chunk.attachmentId} not found in message ${chunk.msgId}`
      );
    }

    const response = await fetch(attachment.url);
    if (!response.ok) {
      if (response.status === 429) {
        const retryAfter = parseInt(
          response.headers.get("Retry-After") || "5",
          10
        );
        console.warn(`Rate limited on download, waiting ${retryAfter}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        const retryResp = await fetch(attachment.url);
        if (!retryResp.ok)
          throw new Error(`Download failed after retry: ${retryResp.status}`);
        const buffer = Buffer.from(await retryResp.arrayBuffer());
        await writeFile(tempFilePath, buffer);
      } else {
        throw new Error(`Download failed with status ${response.status}`);
      }
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      await writeFile(tempFilePath, buffer);
    }

    // Small delay to be gentle on CDN
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Concatenate in order
  const writeStream = createWriteStream(outputPath);
  for (let i = 0; i < sorted.length; i++) {
    const chunkPath = join(tempDir, `chunk_${i}.tmp`);
    const reader = createReadStream(chunkPath);
    reader.pipe(writeStream, { end: false });
    await once(reader, "end");
  }
  writeStream.end();
  await once(writeStream, "finish");

  await rm(tempDir, { recursive: true, force: true });

  console.log(`Reconstruction complete: ${outputPath}`);
}

// ---------------------------------------------------------------------------
// Main entry point (example usage)
// ---------------------------------------------------------------------------
async function main() {
  console.log("Program started.");
  try {
    const token =
      "MTUxODM1MjExNTkxODE3NjI2Ng.G2Gl4i.cLDaeoXUcd2byo8ewT34xZo9XdAQfuBxkL90HI";
    const client = await DiscordClient(token);
    if (!client) throw new Error("Bot token is invalid");
    console.log("Logged in as:", client.user?.tag);

    const chunksMeta = await testUpload(client);
    console.table(chunksMeta);

    const restoredPath = join(TEMP_DIR, "restored.sqlite");
    await reconstructFile(client, chunksMeta, restoredPath);

    console.log("Done.");
  } catch (err) {
    console.error("Fatal error:", err);
  }
}

main();
