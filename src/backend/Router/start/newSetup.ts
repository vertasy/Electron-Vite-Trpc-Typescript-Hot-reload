import { TRPCError } from "@trpc/server";
import { DiscordClient } from "../../Discord/connect";
import { getTextChannels } from "../../Discord/lib/getChannels";
import { getServerInfo } from "../../Discord/lib/getServerInfo";
import { getDb } from "../../Database/getDatabasePath";
import { metadataTable } from "../../Database/schema/metadata";
import { v4 as uuid } from "uuid";
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
    // const client = await DiscordClient(botToken);
    // if (!client) {
    //   throw new TRPCError({
    //     code: "BAD_REQUEST",
    //     message: "Bot token is invalid"
    //   });
    // }
    // const channels = await getTextChannels(client, serverId);
    // let info = await getServerInfo(client, serverId);
    // if (!info) {
    //   // Handle the null case
    //   // For example, you can set info to an empty object
    //   info = {
    //     title: "",
    //     description: "",
    //     pfp: "",
    //     banner: "",
    //     memberCount: 0
    //   };
    // }
    const id = uuid();
    const db = await getDb();
    await db.insert(metadataTable).values({
      id,
      clientId,
      guildId: serverId,
      channelId: "",
      botToken,
      version: 0,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    // await db.insert(metadataTable).values({
    //   id,
    //   clientId,
    //   guildId: serverId,
    //   channelId: "",
    //   botToken,
    //   version: 0,
    //   info: {
    //     title: info.title || "",
    //     description: info.description || "",
    //     pfp: info.pfp || "",
    //     banner: info.banner || "",
    //     memberCount: info.memberCount || 0
    //   },
    //   createdAt: new Date().toISOString(),
    //   updatedAt: new Date().toISOString()
    // });
    return {
      channels: [
        {
          id: "123",
          name: "123"
        }
      ],
      info: {}
    };
  } catch (error) {
    console.error(error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: String(error)
    });
  }
}
