import { TRPCError } from "@trpc/server";
import { DiscordClient } from "../../Discord/connect";
import { getTextChannels } from "../../Discord/lib/getChannels";
import { getServerInfo } from "../../Discord/lib/getServerInfo";
import { getDb } from "../../Database/getDatabasePath";
import { metadataTable } from "../../Database/schema/metadata";
import { v4 as uuid } from "uuid";
import { eq } from "drizzle-orm";
export interface NewSetupArgs {
  clientId: string;
  serverId: string;
  botToken: string;
}

export default async function newSetup({
  clientId,
  serverId,
  botToken
}: NewSetupArgs) {
  try {
    const client = await DiscordClient(botToken);
    if (!client) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Bot token is invalid"
      });
    }
    const channels = await getTextChannels(client, serverId);
    let info = await getServerInfo(client, serverId);
    if (!info) {
      // Handle the null case
      // For example, you can set info to an empty object
      info = {
        serverTitle: "",
        serverDescription: "",
        serverPfp: "",
        serverBanner: "",
        serverMemberCount: 0
      };
    }
    const id = uuid();
    const db = await getDb();
    const oldRecord = await db.select().from(metadataTable).limit(1).all();
    if (oldRecord.length > 0) {
      await db.update(metadataTable).set({
        clientId,
        guildId: serverId,
        channelId: "",
        botToken,
        version: 0,
        serverTitle: info.serverTitle,
        serverDescription: info.serverDescription,
        serverPfp: info.serverPfp,
        serverBanner: info.serverBanner,
        serverMemberCount: info.serverMemberCount,
        updatedAt: new Date().toISOString()
      });
      return {
        channels: channels ?? [],
        info: info as ServerInfo
      };
    }
    await db.insert(metadataTable).values({
      id: "1",
      clientId,
      guildId: serverId,
      channelId: "",
      dbChannelId: "",
      botToken,
      version: 0,
      serverTitle: info.serverTitle,
      serverDescription: info.serverDescription,
      serverPfp: info.serverPfp,
      serverBanner: info.serverBanner,
      serverMemberCount: info.serverMemberCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return {
      channels: channels ?? [],
      info: info as ServerInfo
    };
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}

export async function selectChannel({
  channelId,
  dbChannelId
}: {
  channelId: string;
  dbChannelId: string;
}) {
  try {
    const db = await getDb();
    await db
      .update(metadataTable)
      .set({ channelId, dbChannelId })
      .where(eq(metadataTable.id, "1"));
    return true;
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}

export async function refreshChannels() {
  try {
    const db = await getDb();
    const metadata = await db.select().from(metadataTable).limit(1).all();
    const client = await DiscordClient(metadata[0].botToken);
    if (!client) throw new Error("Bot token is invalid");
    const channels = await getTextChannels(client, metadata[0].guildId);
    return channels ?? [];
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}
