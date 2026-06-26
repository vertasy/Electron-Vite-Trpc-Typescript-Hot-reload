import { Client, ChannelType } from "discord.js";

export async function getTextChannels(
  client: Client,
  guildId: string
): Promise<{ id: string; name: string }[] | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return null;

    await guild.channels.fetch();

    const channels = guild.channels.cache
      .filter((ch) => ch.type === ChannelType.GuildText)
      .map((ch) => ({
        id: ch.id,
        name: ch.name
      }));

    return channels;
  } catch {
    return null;
  }
}
