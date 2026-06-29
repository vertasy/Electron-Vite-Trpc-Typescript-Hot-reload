import { Client, GatewayIntentBits } from "discord.js";

export async function DiscordClient(token: string): Promise<Client | null> {
  console.log("👅👅 discord token", token);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds]
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
