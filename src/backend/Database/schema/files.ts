import {
  sqliteTable,
  text,
  integer,
  blob,
  index
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { thumbnailsTable } from "./thumbnails";
import { groupsTable } from "./groups";

export const filesTable = sqliteTable(
  "files",
  {
    id: text().primaryKey().notNull(),
    groupId: text().references(() => groupsTable.id, {
      onDelete: "cascade"
    }),
    name: text().notNull(),
    size: integer().notNull(),
    mimeType: text().notNull(),
    isEncrypted: integer().notNull(),
    type: text()
      .$type<"image" | "video" | "audio" | "document" | "other">()
      .notNull(),
    thumbnailId: text().references(() => thumbnailsTable.id, {
      onDelete: "set null"
    }),
    ChunkCount: integer().notNull().default(0),
    caption: text(),
    note: text(),
    //discord3
    messageId: text(),
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
    index("files_message_id_idx").on(t.messageId),
    index("files_attachment_id_idx").on(t.attachmentId),
    index("files_url_idx").on(t.url)
  ]
);
