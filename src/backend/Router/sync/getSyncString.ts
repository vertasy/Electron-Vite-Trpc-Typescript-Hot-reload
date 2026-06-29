import { TRPCError } from "@trpc/server";
import { getDb } from "../../Database/getDatabasePath";
import { metadataTable } from "../../Database/schema/metadata";
import syncDiscordDb from "../../lib/handleDbDiscordSync";

export default async function getSyncString() {
  try {
    const sync = await syncDiscordDb();
    if (!sync) throw new Error("Something went wrong.(Failed to sync db)");
    const db = await getDb();
    const rec = await db.select().from(metadataTable).limit(1).all();
    const metadata = rec[0];
    const chunksMsgsIdString = sync.map((chunk) => chunk.msgId).join(",");
    return `${metadata.botToken}!${metadata.dbChannelId}!${chunksMsgsIdString}`;
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}
