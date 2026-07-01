import { readdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import { getLocalDataDir } from "../config";
import { getDb, getDbName, resetDatabase } from "../Database/getDatabasePath";
import { metadataTable } from "../Database/schema/metadata";
import { eq } from "drizzle-orm";
import { DiscordClient } from "../Discord/connect";
import { uploadDbToDiscord } from "./discordSync";
import { v4 as uuid } from "uuid";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.sqlite$/i;

export default async function syncDiscordDb() {
  const localDir = await getLocalDataDir();
  const db = await getDb();
  const dbName = await getDbName();
  console.log("📊 Syncing database:", dbName);

  const rec = await db.select().from(metadataTable).limit(1).all();
  if (!rec.length || !rec[0].botToken) {
    throw new Error("No bot token found in metadata – cannot sync.");
  }

  console.log("🌶️ Using token:", rec[0].botToken);

  await db
    .update(metadataTable)
    .set({ version: rec[0].version + 1 })
    .where(eq(metadataTable.id, "1"));

  const client = await DiscordClient(rec[0].botToken);
  if (!client) throw new Error("Failed to create Discord client");

  const map = await uploadDbToDiscord(
    client,
    rec[0].dbChannelId,
    `${localDir}/${dbName}.sqlite`,
    dbName!,
    rec[0].version + 1
  );

  // client.destroy(); // Clean up after sync
  return map;
}

export async function pullDiscordDb(restoreString: string): Promise<string> {
  const localDir = await getLocalDataDir();

  // 1. Parse restore string
  const parts = restoreString.split("!");
  if (parts.length !== 3) {
    throw new Error(
      "Invalid restore string format. Expected: <BotToken>!<ChannelId>!<msgId1>,<msgId2>,..."
    );
  }
  const [botToken, channelId, msgIdsStr] = parts;
  const msgIds = msgIdsStr
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (msgIds.length === 0) {
    throw new Error("No message IDs found in restore string");
  }

  // 2. Connect to Discord
  const client = await DiscordClient(botToken);
  if (!client) throw new Error("Invalid bot token");

  try {
    // 3. Fetch the channel
    const channel = await client.channels.fetch(channelId);
    if (!channel || !("messages" in channel)) {
      throw new Error("Channel not found or does not support messages");
    }
    const textChannel = channel as {
      messages: { fetch: (id: string) => Promise<any> };
    };

    // 4. Collect all chunks
    const chunkMap = new Map<number, Buffer>();
    let baseName: string | undefined;
    let version: number | undefined;

    for (const msgId of msgIds) {
      try {
        const msg = await textChannel.messages.fetch(msgId);

        for (const [, attachment] of msg.attachments) {
          const match = attachment.name?.match(/^(.+)-(\d+)-(\d+)\.bin$/);
          if (!match) {
            console.warn(
              `Skipping unexpected attachment name: ${attachment.name}`
            );
            continue;
          }

          const [, name, indexStr, verStr] = match;
          const chunkIndex = parseInt(indexStr, 10);
          const ver = parseInt(verStr, 10);

          if (baseName === undefined) {
            baseName = name;
            version = ver;
          } else if (name !== baseName || ver !== version) {
            throw new Error(
              `Inconsistent attachment: expected ${baseName}-<index>-${version}, got ${attachment.name}`
            );
          }

          const response = await fetch(attachment.url);
          if (!response.ok) {
            throw new Error(
              `Failed to download attachment: ${response.statusText}`
            );
          }
          const buffer = Buffer.from(await response.arrayBuffer());
          chunkMap.set(chunkIndex, buffer);
        }
      } catch (err) {
        throw new Error(
          `Error processing message ${msgId}: ${err instanceof Error ? err.message : err}`
        );
      }
    }

    if (chunkMap.size === 0) {
      throw new Error("No valid chunks found");
    }

    // 5. Verify contiguous chunk indices
    const indices = Array.from(chunkMap.keys()).sort((a, b) => a - b);
    for (let i = 0; i < indices.length; i++) {
      if (indices[i] !== i) {
        throw new Error(`Missing chunk at index ${i}`);
      }
    }

    // 6. Concatenate chunks
    const buffers: Buffer[] = [];
    for (let i = 0; i < indices.length; i++) {
      buffers.push(chunkMap.get(i)!);
    }
    const fileBuffer = Buffer.concat(buffers);

    // 7. Close the current database connection BEFORE deleting old files
    resetDatabase();

    // 8. Delete any existing UUID .sqlite files
    const existingFiles = await readdir(localDir, { withFileTypes: true });
    const uuidFilesToRemove = existingFiles
      .filter((entry) => entry.isFile() && UUID_REGEX.test(entry.name))
      .map((entry) => entry.name);

    for (const file of uuidFilesToRemove) {
      const filePath = join(localDir, file);
      try {
        await unlink(filePath);
        console.log(`Removed old database: ${file}`);
      } catch (err) {
        console.warn(`Failed to remove old database ${file}: ${err}`);
      }
    }

    // 9. Save the restored database with a fresh UUID
    const destPath = join(localDir, `${uuid()}.sqlite`);
    await writeFile(destPath, fileBuffer);

    return destPath;
  } finally {
    client.destroy();
  }
}
