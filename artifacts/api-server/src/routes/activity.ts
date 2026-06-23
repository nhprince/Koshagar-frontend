import { Router } from "express";
import { db, activityTable, usersTable } from "@workspace/db";
import { eq, desc, lt } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/activity", requireAuth, async (req, res) => {
  const cursor = req.query.cursor ? parseInt(req.query.cursor as string) : undefined;
  const limit = Math.min(parseInt((req.query.limit as string) || "20"), 50);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));

  let query = db.select().from(activityTable)
    .where(eq(activityTable.userId, req.userId!))
    .orderBy(desc(activityTable.createdAt))
    .limit(limit + 1);

  const entries = await query;
  const hasMore = entries.length > limit;
  const page = hasMore ? entries.slice(0, limit) : entries;

  res.json({
    entries: page.map(e => ({
      id: e.id,
      action: e.action,
      fileName: e.fileName,
      fileId: e.fileId ?? null,
      userId: e.userId,
      userName: user?.name ?? "Unknown",
      createdAt: e.createdAt.toISOString(),
    })),
    hasMore,
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
});

export default router;
