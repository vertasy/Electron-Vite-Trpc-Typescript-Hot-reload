import { getDb } from "../../Database/getDatabasePath";
import { metadataTable } from "../../Database/schema/metadata";

export default async function GetStatus() {
  const db = await getDb();
  const metadata = await db.select().from(metadataTable).limit(1).all();
  console.log(metadata);
  if (metadata.length === 0 || metadata[0].channelId === "") return 0;
  if (metadata[0].channelId === null) return 0;
  if (metadata[0].hashedCode === null) return 1;

  //success
  if (
    metadata[0].hashedCode !== null &&
    metadata[0].channelId !== null &&
    metadata[0].guildId !== null
  )
    return 2;
  return 0;
}
