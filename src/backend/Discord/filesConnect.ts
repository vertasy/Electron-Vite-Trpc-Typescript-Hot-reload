import { Client, GatewayIntentBits } from "discord.js";

export async function FilesDiscordClient(
  token: string
): Promise<Client | null> {
  console.log("👅👅 discord token", token);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  try {
    await client.login(token);
    return client;
  } catch (err) {
    console.error("Discord login failed:", err);
    client.destroy(); // clean up the partially‑created client
    return null;
  }
}
