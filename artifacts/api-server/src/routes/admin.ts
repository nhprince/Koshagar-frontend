import { Router } from "express";
import { db, usersTable, filesTable, activityTable } from "@workspace/db";
import { eq, desc, gte, sql, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/admin/stats", requireAuth, requireAdmin, async (req, res) => {
  const [userCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(usersTable);
  const [fileCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(filesTable).where(eq(filesTable.type, "file"));
  const [storageResult] = await db.select({
    total: sql<number>`COALESCE(SUM(${filesTable.size}), 0)`,
  }).from(filesTable).where(eq(filesTable.type, "file"));

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [activeToday] = await db.select({ count: sql<number>`COUNT(DISTINCT ${usersTable.id})` })
    .from(usersTable)
    .where(gte(usersTable.lastActiveAt, oneDayAgo));

  res.json({
    totalUsers: Number(userCount?.count ?? 0),
    totalFiles: Number(fileCount?.count ?? 0),
    totalStorageBytes: Number(storageResult?.total ?? 0),
    activeToday: Number(activeToday?.count ?? 0),
  });
});

router.get("/admin/users", requireAuth, requireAdmin, async (req, res) => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));

  const result = await Promise.all(users.map(async (user) => {
    const [fileStats] = await db.select({
      fileCount: sql<number>`COUNT(*)`,
      storageBytes: sql<number>`COALESCE(SUM(${filesTable.size}), 0)`,
    }).from(filesTable).where(and(eq(filesTable.ownerId, user.id), eq(filesTable.type, "file")));

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      fileCount: Number(fileStats?.fileCount ?? 0),
      storageBytes: Number(fileStats?.storageBytes ?? 0),
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    };
  }));

  res.json(result);
});

router.get("/admin/activity", requireAuth, requireAdmin, async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 100);

  const entries = await db.select({
    id: activityTable.id,
    action: activityTable.action,
    fileName: activityTable.fileName,
    fileId: activityTable.fileId,
    userId: activityTable.userId,
    userName: usersTable.name,
    createdAt: activityTable.createdAt,
  }).from(activityTable)
    .innerJoin(usersTable, eq(activityTable.userId, usersTable.id))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit);

  res.json(entries.map(e => ({
    id: e.id,
    action: e.action,
    fileName: e.fileName,
    fileId: e.fileId ?? null,
    userId: e.userId,
    userName: e.userName,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
