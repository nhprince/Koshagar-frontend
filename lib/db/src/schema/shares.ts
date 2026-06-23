import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { filesTable } from "./files";
import { usersTable } from "./users";

export const sharesTable = pgTable("shares", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  fileId: integer("file_id").notNull().references(() => filesTable.id, { onDelete: "cascade" }),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash"),
  expiresAt: timestamp("expires_at"),
  allowDownload: boolean("allow_download").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  downloadCount: integer("download_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShareSchema = createInsertSchema(sharesTable).omit({ id: true, createdAt: true, viewCount: true, downloadCount: true });
export type InsertShare = z.infer<typeof insertShareSchema>;
export type Share = typeof sharesTable.$inferSelect;
