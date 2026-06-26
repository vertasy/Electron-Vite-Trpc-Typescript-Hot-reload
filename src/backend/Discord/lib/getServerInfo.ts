import { Client } from "discord.js";

export async function getServerInfo(
  client: Client,
  guildId: string
): Promise<ServerInfo | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return null;

    // Ensure full data where possible
    await guild.fetch();

    return {
      serverTitle: guild.name,
      serverDescription: guild.description ?? "",
      serverPfp: guild.iconURL({ size: 512 }) ?? "",
      serverBanner: guild.bannerURL({ size: 1024 }) ?? "",
      serverMemberCount: guild.memberCount ?? 0
    };
  } catch {
    return null;
  }
}
