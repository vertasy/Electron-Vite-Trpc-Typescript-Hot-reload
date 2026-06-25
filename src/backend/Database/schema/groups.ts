import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const groupsTable = sqliteTable("groups", {
  id: text().primaryKey().notNull(),
  createdAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .notNull(),
  updatedAt: text()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdateFn(() => sql`(CURRENT_TIMESTAMP)`)
});
