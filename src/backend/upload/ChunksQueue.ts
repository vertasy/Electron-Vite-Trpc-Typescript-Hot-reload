import { randomBytes } from "crypto";
import { AttachmentBuilder, Client, TextChannel } from "discord.js";
import { v4 as uuid } from "uuid";

import { getDb } from "../Database/getDatabasePath";
import { metadataTable } from "../Database/schema/metadata";
import { FilesDiscordClient } from "../Discord/filesConnect";
import { chunksTable } from "../Database/schema/chunks";

export interface ChunkQueueJob {
  fileId: string;
  chunkIndex: number;
  chunkSize: number;
  ext: string;
  totalChunks: number;
  isEncrypted: boolean;
  data: Buffer;
}

const videoExtensions = [
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".flv",
  ".wmv"
];

function getChunkFileName(job: ChunkQueueJob): string {
  const base = `${job.fileId}-${job.chunkIndex}`;

  if (job.isEncrypted) {
    return `${base}.bin`;
  }

  if (job.totalChunks > 1) {
    return `${base}.bin`;
  }

  // single chunk + not encrypted → original extension
  return `${base}.${job.ext}`;
}

/**
 * Uploads a batch of chunks in a single Discord message.
 * The batch should already be grouped to the desired size.
 */
export async function uploadBatch(
  client: Client,
  channelId: string,
  jobs: ChunkQueueJob[]
) {
  console.log(
    "Sending message with",
    jobs.length,
    "attachments:",
    jobs.map((f) => f.fileId)
  );
  const channel = (await client.channels.fetch(channelId)) as TextChannel;

  if (!channel?.isTextBased()) {
    throw new Error("Channel not sendable");
  }

  const files = jobs.map(
    (job) =>
      new AttachmentBuilder(job.data, {
        name: getChunkFileName(job)
      })
  );

  const nonce = randomBytes(8).toString("hex");

  const data = await channel.send({
    files,
    nonce
  });

  // Save chunks to DB
  const db = await getDb();
  const arr = [];
  for (let j = 0; j < jobs.length; j++) {
    const discordMsgId = data.id;
    const attachmentId = data.attachments.at(j)?.id;
    const attachmentUrl = data.attachments.at(j)?.url;
    const dbId = uuid();
    arr.push({
      id: dbId,
      fileId: jobs[j].fileId,
      size: jobs[j].data.byteLength,
      chunkIndex: jobs[j].chunkIndex,
      isEncrypted: jobs[j].isEncrypted ? 1 : 0,
      messageId: discordMsgId,
      url: attachmentUrl,
      attachmentId: attachmentId,
      totalChunks: jobs[j].totalChunks
    });
  }
  await db.insert(chunksTable).values(arr);
  console.log(
    "Uploaded Discord message:",
    jobs.map((j) => j.chunkIndex)
  );
}

export class ChunkQueue {
  private readonly jobs: ChunkQueueJob[] = [];
  private processing = false;
  private readonly chunksPerMessage: number;

  /**
   * @param chunksPerMessage - Number of chunks to send per Discord message (default: 2)
   */
  constructor(chunksPerMessage: number = 2) {
    this.chunksPerMessage = chunksPerMessage;
  }

  async enqueue(job: ChunkQueueJob): Promise<void> {
    this.jobs.push(job);
    if (!this.processing) {
      this.processing = true;
      this.processNextBatch();
    }
  }

  /**
   * Forcefully sends any remaining chunks in the queue.
   * Call this once after ALL files have been processed.
   */
  async flush(): Promise<void> {
    if (this.jobs.length === 0) return;
    await this.drainQueue();
  }

  private processNextBatch(): void {
    this.trySendBatch();
  }

  private async trySendBatch(): Promise<void> {
    while (this.jobs.length >= this.chunksPerMessage) {
      const batch = this.jobs.splice(0, this.chunksPerMessage);
      try {
        await this.uploadJobs(batch);
        console.log(
          `[QUEUE] Uploaded batch: ${batch.map((j) => j.chunkIndex)}`
        );
      } catch (err) {
        console.error("[QUEUE] Upload failed:", err);
        this.processing = false;
        return;
      }
    }
    this.processing = false;
    // If fewer than chunksPerMessage remain, they stay until flush() is called.
  }

  private async drainQueue(): Promise<void> {
    while (this.jobs.length > 0) {
      const batch = this.jobs.splice(0, this.chunksPerMessage);
      try {
        await this.uploadJobs(batch);
        console.log(`[QUEUE] Flush batch: ${batch.map((j) => j.chunkIndex)}`);
      } catch (err) {
        console.error("[QUEUE] Flush upload failed:", err);
        break;
      }
    }
  }

  private async uploadJobs(jobs: ChunkQueueJob[]): Promise<void> {
    const db = await getDb();
    const metadata = await db.select().from(metadataTable).limit(1).all();
    const discordClient = await FilesDiscordClient(metadata[0].botToken);
    if (!discordClient) throw new Error("Bot token is invalid");
    await uploadBatch(discordClient, metadata[0].channelId, jobs);
  }
}
