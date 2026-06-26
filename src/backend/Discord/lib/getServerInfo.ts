import { Client } from "discord.js";

export async function getServerInfo(
  client: Client,
  guildId: string
): Promise<{
  title: string;
  description: string | null;
  pfp: string | null;
  banner: string | null;
  memberCount: number;
} | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return null;

    // Ensure full data where possible
    await guild.fetch();

    return {
      title: guild.name,
      description: guild.description ?? null,
      pfp: guild.iconURL({ size: 512 }) ?? null,
      banner: guild.bannerURL({ size: 1024 }) ?? null,
      memberCount: guild.memberCount ?? 0
    };
  } catch {
    return null;
  }
}
