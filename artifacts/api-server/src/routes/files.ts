import { Router } from "express";
import { db, filesTable, activityTable, usersTable, sharesTable } from "@workspace/db";
import { eq, and, isNull, isNotNull, ilike, asc, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

function toFileItem(file: typeof filesTable.$inferSelect) {
  return {
    id: file.id,
    name: file.name,
    type: file.type,
    mimeType: file.mimeType,
    size: file.size,
    starred: file.starred,
    trashed: file.trashed,
    folderId: file.folderId ?? null,
    ownerId: file.ownerId,
    shareToken: file.shareToken ?? null,
    thumbnailUrl: file.thumbnailUrl ?? null,
    createdAt: file.createdAt.toISOString(),
    updatedAt: file.updatedAt.toISOString(),
    trashedAt: file.trashedAt?.toISOString() ?? null,
  };
}

async function logActivity(
  userId: number,
  action: typeof activityTable.$inferInsert["action"],
  fileName: string,
  fileId?: number
) {
  await db.insert(activityTable).values({ userId, action, fileName, fileId: fileId ?? null });
}

router.get("/files", requireAuth, async (req, res) => {
  const {
    folderId,
    starred,
    trash,
    search,
    sort = "name",
    order = "asc",
  } = req.query as Record<string, string>;

  const conditions = [eq(filesTable.ownerId, req.userId!)];

  if (folderId !== undefined && folderId !== "null" && folderId !== "") {
    conditions.push(eq(filesTable.folderId, parseInt(folderId)));
  } else if (folderId === "null" || folderId === "") {
    conditions.push(isNull(filesTable.folderId));
  }

  if (starred === "true") conditions.push(eq(filesTable.starred, true));

  if (trash === "true") {
    conditions.push(eq(filesTable.trashed, true));
  } else {
    conditions.push(eq(filesTable.trashed, false));
  }

  if (search) {
    conditions.push(ilike(filesTable.name, `%${search}%`));
  }

  const sortCol = sort === "size" ? filesTable.size
    : sort === "createdAt" ? filesTable.createdAt
    : sort === "updatedAt" ? filesTable.updatedAt
    : filesTable.name;

  const orderFn = order === "desc" ? desc : asc;

  const rows = await db.select().from(filesTable)
    .where(and(...conditions))
    .orderBy(orderFn(sortCol));

  const folders = rows.filter(r => r.type === "folder").map(toFileItem);
  const files = rows.filter(r => r.type === "file").map(toFileItem);

  res.json({ folders, files });
});

router.get("/files/recent", requireAuth, async (req, res) => {
  const files = await db.select().from(filesTable)
    .where(and(eq(filesTable.ownerId, req.userId!), eq(filesTable.trashed, false), eq(filesTable.type, "file")))
    .orderBy(desc(filesTable.updatedAt))
    .limit(20);
  res.json(files.map(toFileItem));
});

router.get("/files/shared", requireAuth, async (req, res) => {
  const files = await db.select().from(filesTable)
    .where(and(eq(filesTable.ownerId, req.userId!), isNotNull(filesTable.shareToken), eq(filesTable.trashed, false)));
  res.json(files.map(toFileItem));
});

router.post("/files/upload", requireAuth, async (req, res) => {
  const { name, mimeType, size, folderId, dataUrl, thumbnailUrl } = req.body;
  if (!name || !mimeType || size === undefined) {
    res.status(400).json({ error: "name, mimeType, and size are required" });
    return;
  }

  const [file] = await db.insert(filesTable).values({
    name,
    type: "file",
    mimeType,
    size: Number(size),
    folderId: folderId ?? null,
    ownerId: req.userId!,
    dataUrl: dataUrl ?? null,
    thumbnailUrl: thumbnailUrl ?? (mimeType.startsWith("image/") ? dataUrl ?? null : null),
  }).returning();

  await logActivity(req.userId!, "upload", name, file.id);
  res.status(201).json(toFileItem(file));
});

router.delete("/files/empty-trash", requireAuth, async (req, res) => {
  const trashedFiles = await db.select().from(filesTable)
    .where(and(eq(filesTable.ownerId, req.userId!), eq(filesTable.trashed, true)));

  for (const file of trashedFiles) {
    await db.delete(filesTable).where(eq(filesTable.id, file.id));
  }
  res.status(204).send();
});

router.get("/files/:id", requireAuth, async (req, res) => {
  const [file] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, parseInt(req.params.id as string)), eq(filesTable.ownerId, req.userId!)));
  if (!file) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...toFileItem(file), dataUrl: file.dataUrl ?? null });
});

router.get("/files/:id/stream", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [file] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));

  if (!file || !file.dataUrl) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const match = file.dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
  if (!match) {
    res.status(400).json({ error: "Invalid file data" });
    return;
  }

  const buffer = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  const total = buffer.length;
  const rangeHeader = req.headers.range;

  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(file.name)}"`);
  res.setHeader("Cache-Control", "private, no-store");

  if (rangeHeader) {
    const rangeStr = rangeHeader.replace(/bytes=/, "");
    const parts = rangeStr.split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
    const clampedEnd = Math.min(end, total - 1);
    const chunkSize = clampedEnd - start + 1;

    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${clampedEnd}/${total}`);
    res.setHeader("Content-Length", chunkSize);
    res.end(buffer.subarray(start, clampedEnd + 1));
  } else {
    res.setHeader("Content-Length", total);
    res.status(200).end(buffer);
  }
});

router.patch("/files/:id", requireAuth, async (req, res) => {
  const { name } = req.body;
  const id = parseInt(req.params.id as string);

  const [existing] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [file] = await db.update(filesTable)
    .set({ name, updatedAt: new Date() })
    .where(eq(filesTable.id, id))
    .returning();

  await logActivity(req.userId!, "rename", name, id);
  res.json(toFileItem(file));
});

router.patch("/files/:id/content", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { dataUrl, size } = req.body;

  const [existing] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [file] = await db.update(filesTable)
    .set({ dataUrl: dataUrl ?? existing.dataUrl, size: typeof size === "number" ? size : existing.size, updatedAt: new Date() })
    .where(eq(filesTable.id, id))
    .returning();

  res.json({ ...toFileItem(file), dataUrl: file.dataUrl ?? null });
});

router.delete("/files/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [existing] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(filesTable).where(eq(filesTable.id, id));
  await logActivity(req.userId!, "delete", existing.name, id);
  res.status(204).send();
});

router.patch("/files/:id/star", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { starred } = req.body;

  const [existing] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [file] = await db.update(filesTable)
    .set({ starred: Boolean(starred), updatedAt: new Date() })
    .where(eq(filesTable.id, id))
    .returning();

  await logActivity(req.userId!, "star", existing.name, id);
  res.json(toFileItem(file));
});

router.patch("/files/:id/trash", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { trashed } = req.body;

  const [existing] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [file] = await db.update(filesTable)
    .set({
      trashed: Boolean(trashed),
      trashedAt: trashed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(filesTable.id, id))
    .returning();

  await logActivity(req.userId!, trashed ? "trash" : "restore", existing.name, id);
  res.json(toFileItem(file));
});

router.patch("/files/:id/move", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const { folderId } = req.body;

  const [existing] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!)));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [file] = await db.update(filesTable)
    .set({ folderId: folderId ?? null, updatedAt: new Date() })
    .where(eq(filesTable.id, id))
    .returning();

  await logActivity(req.userId!, "move", existing.name, id);
  res.json(toFileItem(file));
});

export default router;
