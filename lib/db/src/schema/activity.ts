import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const actionEnum = pgEnum("activity_action", [
  "upload", "download", "share", "delete", "rename", "move", "trash", "restore", "star"
]);

export const activityTable = pgTable("activity", {
  id: serial("id").primaryKey(),
  action: actionEnum("action").notNull(),
  fileName: text("file_name").notNull(),
  fileId: integer("file_id"),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Activity = typeof activityTable.$inferSelect;
