import { Router } from "express";
import { db, filesTable, activityTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import archiver from "archiver";

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

router.post("/folders", requireAuth, async (req, res) => {
  const { name, folderId } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [folder] = await db.insert(filesTable).values({
    name,
    type: "folder",
    mimeType: "application/vnd.koshagar.folder",
    size: 0,
    folderId: folderId ?? null,
    ownerId: req.userId!,
  }).returning();

  res.status(201).json(toFileItem(folder));
});

router.get("/folders/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [folder] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!), eq(filesTable.type, "folder")));

  if (!folder) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const breadcrumb: { id: number; name: string }[] = [];
  let current: typeof filesTable.$inferSelect | undefined = folder;

  while (current?.folderId) {
    const [parent] = await db.select().from(filesTable).where(eq(filesTable.id, current.folderId));
    if (!parent) break;
    breadcrumb.unshift({ id: parent.id, name: parent.name });
    current = parent;
  }

  res.json({
    folder: toFileItem(folder),
    breadcrumb,
  });
});

router.get("/folders/:id/download-zip", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [folder] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, id), eq(filesTable.ownerId, req.userId!), eq(filesTable.type, "folder")));

  if (!folder) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(folder.name)}.zip"`);

  const archive = archiver("zip", { zlib: { level: 6 } });
  archive.on("error", () => res.end());
  archive.pipe(res);

  async function addFolder(folderId: number, prefix: string) {
    const items = await db.select().from(filesTable)
      .where(and(eq(filesTable.folderId, folderId), eq(filesTable.ownerId, req.userId!), eq(filesTable.trashed, false)));
    for (const item of items) {
      if (item.type === "file" && item.dataUrl) {
        const match = item.dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
        if (match) {
          const buf = Buffer.from(match[1], "base64");
          archive.append(buf, { name: `${prefix}${item.name}` });
        }
      } else if (item.type === "folder") {
        await addFolder(item.id, `${prefix}${item.name}/`);
      }
    }
  }

  await addFolder(id, "");
  await archive.finalize();
});

export default router;
