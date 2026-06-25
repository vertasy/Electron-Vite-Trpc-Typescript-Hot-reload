import {
  sqliteTable,
  text,
  integer,
  blob,
  index
} from "drizzle-orm/sqlite-core";
import { personsTable } from "./persons";
import { sql } from "drizzle-orm";

export const thumbnailsTable = sqliteTable(
  "thumbnails",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    size: integer().notNull(),
    // thumbnailId:
    personId: text().references(() => personsTable.id, {
      onDelete: "set null"
    }),
    embedding: blob("embedding"),
    caption: text(),
    //discord
    messageId: text().notNull(),
    attachmentId: text(),
    url: text(),
    //timestamps
    createdAt: text()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .notNull(),
    updatedAt: text()
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`)
  },
  (t) => [
    index("thumbnails_message_id_idx").on(t.messageId),
    index("thumbnails_attachment_id_idx").on(t.attachmentId),
    index("thumbnails_url_idx").on(t.url)
  ]
);
