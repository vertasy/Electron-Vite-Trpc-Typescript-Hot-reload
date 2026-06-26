import { Client, GatewayIntentBits } from "discord.js";

let discordClient: Client | null = null;

export async function DiscordClient(token: string): Promise<Client | null> {
  if (discordClient) return discordClient;

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
  });

  try {
    await client.login(token);
  } catch (err) {
    return null;
  }

  discordClient = client;
  return client;
}
