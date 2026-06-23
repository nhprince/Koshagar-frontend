import { Router } from "express";
import { db, filesTable } from "@workspace/db";
import { eq, and, sum, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { sql } from "drizzle-orm";

const router = Router();

const TOTAL_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB

router.get("/storage/usage", requireAuth, async (req, res) => {
  const [result] = await db.select({
    totalSize: sql<number>`COALESCE(SUM(${filesTable.size}), 0)`,
    fileCount: sql<number>`COUNT(*)`,
  }).from(filesTable).where(
    and(eq(filesTable.ownerId, req.userId!), eq(filesTable.type, "file"), eq(filesTable.trashed, false))
  );

  res.json({
    usedBytes: Number(result?.totalSize ?? 0),
    totalBytes: TOTAL_BYTES,
    fileCount: Number(result?.fileCount ?? 0),
  });
});

export default router;
