import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const metadataTable = sqliteTable("metadata", {
  id: text().primaryKey().notNull(),
  clientId: text().notNull(),
  guildId: text().notNull(),
  channelId: text().notNull(),
  botToken: text().notNull(),
  version: integer().notNull().default(0),
  serverTitle: text(),
  serverDescription: text(),
  serverPfp: text(),
  serverBanner: text(),
  serverMemberCount: integer(),
  hashedCode: text(),
  createdAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`)
});
