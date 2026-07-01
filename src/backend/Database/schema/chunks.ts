import {
  sqliteTable,
  text,
  integer,
  blob,
  index
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { filesTable } from "./files";

export const chunksTable = sqliteTable(
  "chunks",
  {
    id: text().primaryKey().notNull(),
    fileId: text()
      .notNull()
      .references(() => filesTable.id, {
        onDelete: "cascade"
      }),
    size: integer().notNull(),
    // mimeType: text().notNull(),
    chunkIndex: integer().notNull(),
    isEncrypted: integer().notNull(),
    //discord3
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
    index("chunks_message_id_idx").on(t.messageId),
    index("chunks_attachment_id_idx").on(t.attachmentId),
    index("chunks_url_idx").on(t.url)
  ]
);
