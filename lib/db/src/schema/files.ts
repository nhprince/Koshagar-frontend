import { pgTable, serial, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const fileTypeEnum = pgEnum("file_type", ["file", "folder"]);

export const filesTable = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: fileTypeEnum("type").notNull().default("file"),
  mimeType: text("mime_type").notNull().default("application/octet-stream"),
  size: integer("size").notNull().default(0),
  starred: boolean("starred").notNull().default(false),
  trashed: boolean("trashed").notNull().default(false),
  folderId: integer("folder_id"),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  shareToken: text("share_token"),
  thumbnailUrl: text("thumbnail_url"),
  dataUrl: text("data_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  trashedAt: timestamp("trashed_at"),
});

export const insertFileSchema = createInsertSchema(filesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertFile = z.infer<typeof insertFileSchema>;
export type FileRecord = typeof filesTable.$inferSelect;
