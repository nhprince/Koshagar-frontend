import { Router } from "express";
import { db, filesTable, sharesTable, usersTable, activityTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";
import * as archiverLib from "archiver";
const archiverCreate = (archiverLib as any).default ?? archiverLib;

const router = Router();

function hashSharePassword(password: string) {
  return crypto.createHash("sha256").update(password + "koshagar_share_salt").digest("hex");
}

function toShareLink(share: typeof sharesTable.$inferSelect) {
  return {
    id: share.id,
    token: share.token,
    fileId: share.fileId,
    password: share.passwordHash ? "[protected]" : null,
    expiresAt: share.expiresAt?.toISOString() ?? null,
    allowDownload: share.allowDownload,
    viewCount: share.viewCount,
    downloadCount: share.downloadCount,
    createdAt: share.createdAt.toISOString(),
  };
}

router.post("/share", requireAuth, async (req, res) => {
  const { fileId, password, expiresAt, allowDownload } = req.body;
  if (!fileId) {
    res.status(400).json({ error: "fileId is required" });
    return;
  }

  const [file] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, fileId), eq(filesTable.ownerId, req.userId!)));
  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  // If file already has a share, delete it first (replace)
  if (file.shareToken) {
    await db.delete(sharesTable).where(eq(sharesTable.token, file.shareToken));
  }

  const token = crypto.randomBytes(16).toString("hex");
  const passwordHash = password ? hashSharePassword(password) : null;

  const [share] = await db.insert(sharesTable).values({
    token,
    fileId,
    ownerId: req.userId!,
    passwordHash,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    allowDownload: allowDownload !== false,
  }).returning();

  await db.update(filesTable).set({ shareToken: token }).where(eq(filesTable.id, fileId));
  await db.insert(activityTable).values({ userId: req.userId!, action: "share", fileName: file.name, fileId });

  res.status(201).json(toShareLink(share));
});

router.get("/share/:token", async (req, res) => {
  const token = req.params.token as string;
  const password = req.query.password as string | undefined;

  const [share] = await db.select().from(sharesTable).where(eq(sharesTable.token, token));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    res.status(404).json({ error: "Share link expired" });
    return;
  }

  if (share.passwordHash) {
    if (!password) {
      res.json({ requiresPassword: true, file: null, allowDownload: false, sharedBy: null, expiresAt: null });
      return;
    }
    const hash = hashSharePassword(password);
    if (hash !== share.passwordHash) {
      res.status(401).json({ error: "Invalid password", requiresPassword: true });
      return;
    }
  }

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, share.fileId));
  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, share.ownerId));

  await db.update(sharesTable).set({ viewCount: share.viewCount + 1 }).where(eq(sharesTable.token, token));

  res.json({
    file: {
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
      dataUrl: null,
      createdAt: file.createdAt.toISOString(),
      updatedAt: file.updatedAt.toISOString(),
      trashedAt: file.trashedAt?.toISOString() ?? null,
    },
    allowDownload: share.allowDownload,
    sharedBy: owner?.name ?? "Unknown",
    expiresAt: share.expiresAt?.toISOString() ?? null,
    requiresPassword: false,
  });
});

router.patch("/share/:token", requireAuth, async (req, res) => {
  const token = req.params.token as string;
  const { allowDownload, expiresAt, password } = req.body;

  const [share] = await db.select().from(sharesTable)
    .where(and(eq(sharesTable.token, token), eq(sharesTable.ownerId, req.userId!)));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const updates: Partial<typeof sharesTable.$inferInsert> = {};
  if (allowDownload !== undefined) updates.allowDownload = allowDownload;
  if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (password !== undefined) {
    updates.passwordHash = password ? hashSharePassword(password) : null;
  }

  const [updated] = await db.update(sharesTable)
    .set(updates)
    .where(eq(sharesTable.token, token))
    .returning();

  res.json(toShareLink(updated));
});

router.delete("/share/:token", requireAuth, async (req, res) => {
  const token = req.params.token as string;
  const [share] = await db.select().from(sharesTable)
    .where(and(eq(sharesTable.token, token), eq(sharesTable.ownerId, req.userId!)));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(sharesTable).where(eq(sharesTable.token, token));
  await db.update(filesTable).set({ shareToken: null }).where(eq(filesTable.id, share.fileId));
  res.status(204).send();
});

router.get("/share/:token/browse", async (req, res) => {
  const token = req.params.token as string;
  const password = req.query.password as string | undefined;
  const subfolderId = req.query.folderId ? parseInt(req.query.folderId as string) : null;

  const [share] = await db.select().from(sharesTable).where(eq(sharesTable.token, token));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    res.status(410).json({ error: "Share link expired" });
    return;
  }

  if (share.passwordHash) {
    if (!password) {
      res.status(401).json({ error: "Password required", requiresPassword: true });
      return;
    }
    const hash = hashSharePassword(password);
    if (hash !== share.passwordHash) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }
  }

  const [rootFolder] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, share.fileId), eq(filesTable.type, "folder")));

  if (!rootFolder) {
    res.status(400).json({ error: "Shared item is not a folder" });
    return;
  }

  // Normalize: treat navigating to rootFolder.id same as navigating to root (null)
  const normalizedSubfolderId = (subfolderId === rootFolder.id) ? null : subfolderId;

  const targetFolderId = normalizedSubfolderId ?? rootFolder.id;

  if (normalizedSubfolderId && normalizedSubfolderId !== rootFolder.id) {
    const [subcheck] = await db.select().from(filesTable)
      .where(and(eq(filesTable.id, normalizedSubfolderId!), eq(filesTable.ownerId, rootFolder.ownerId), eq(filesTable.type, "folder")));
    if (!subcheck) {
      res.status(403).json({ error: "Access denied" });
      return;
    }
  }

  const contents = await db.select().from(filesTable)
    .where(and(eq(filesTable.folderId, targetFolderId), eq(filesTable.ownerId, rootFolder.ownerId), eq(filesTable.trashed, false)));

  // Breadcrumb = ancestors only (not the current folder itself)
  const breadcrumb: { id: number; name: string }[] = [];
  let currentFolderName = rootFolder.name;
  if (normalizedSubfolderId) {
    const [currentFolderRecord] = await db.select().from(filesTable).where(eq(filesTable.id, normalizedSubfolderId));
    currentFolderName = currentFolderRecord?.name ?? rootFolder.name;
    let walkId: number | null = currentFolderRecord?.folderId ?? null;
    const seen = new Set<number>();
    while (walkId && walkId !== rootFolder.id) {
      if (seen.has(walkId)) break;
      seen.add(walkId);
      const [f] = await db.select().from(filesTable).where(eq(filesTable.id, walkId));
      if (!f) break;
      breadcrumb.unshift({ id: f.id, name: f.name });
      walkId = f.folderId ?? null;
    }
  }

  const folders = contents.filter(c => c.type === "folder").map(f => ({
    id: f.id, name: f.name, type: f.type, mimeType: f.mimeType, size: f.size,
    thumbnailUrl: f.thumbnailUrl ?? null, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString(),
  }));
  const files = contents.filter(c => c.type === "file").map(f => ({
    id: f.id, name: f.name, type: f.type, mimeType: f.mimeType, size: f.size,
    thumbnailUrl: f.thumbnailUrl ?? null, createdAt: f.createdAt.toISOString(), updatedAt: f.updatedAt.toISOString(),
  }));

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, rootFolder.ownerId));

  res.json({
    rootFolder: { id: rootFolder.id, name: rootFolder.name },
    currentFolder: { id: targetFolderId, name: currentFolderName },
    breadcrumb,
    folders,
    files,
    allowDownload: share.allowDownload,
    sharedBy: owner?.name ?? "Unknown",
  });
});

router.get("/share/:token/download-zip", async (req, res) => {
  const token = req.params.token as string;
  const password = req.query.password as string | undefined;

  const [share] = await db.select().from(sharesTable).where(eq(sharesTable.token, token));
  if (!share) { res.status(404).json({ error: "Not found" }); return; }
  if (share.expiresAt && share.expiresAt < new Date()) { res.status(410).json({ error: "Expired" }); return; }
  if (!share.allowDownload) { res.status(403).json({ error: "Download not allowed" }); return; }

  if (share.passwordHash) {
    if (!password) { res.status(401).json({ error: "Password required" }); return; }
    if (hashSharePassword(password) !== share.passwordHash) { res.status(401).json({ error: "Invalid password" }); return; }
  }

  const [rootFolder] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, share.fileId), eq(filesTable.type, "folder")));
  if (!rootFolder) { res.status(400).json({ error: "Not a folder share" }); return; }

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(rootFolder.name)}.zip"`);
  const archive = archiverCreate("zip", { zlib: { level: 6 } });
  archive.on("error", () => res.end());
  archive.pipe(res);

  async function addFolder(folderId: number, prefix: string) {
    const items = await db.select().from(filesTable)
      .where(and(eq(filesTable.folderId, folderId), eq(filesTable.ownerId, rootFolder.ownerId), eq(filesTable.trashed, false)));
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

  await addFolder(rootFolder.id, "");
  await archive.finalize();
});

router.get("/share/:token/file/:fileId/download", async (req, res) => {
  const token = req.params.token as string;
  const fileId = parseInt(req.params.fileId as string);
  const password = req.query.password as string | undefined;

  const [share] = await db.select().from(sharesTable).where(eq(sharesTable.token, token));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    res.status(410).json({ error: "Share link expired" });
    return;
  }

  if (!share.allowDownload) {
    res.status(403).json({ error: "Download not allowed" });
    return;
  }

  if (share.passwordHash) {
    if (!password) {
      res.status(401).json({ error: "Password required" });
      return;
    }
    const hash = hashSharePassword(password);
    if (hash !== share.passwordHash) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }
  }

  const [rootFolder] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, share.fileId), eq(filesTable.type, "folder")));
  if (!rootFolder) {
    res.status(400).json({ error: "Not a shared folder" });
    return;
  }

  const [file] = await db.select().from(filesTable)
    .where(and(eq(filesTable.id, fileId), eq(filesTable.ownerId, rootFolder.ownerId), eq(filesTable.type, "file")));

  if (!file) {
    res.status(404).json({ error: "File not found in shared folder" });
    return;
  }

  await db.update(sharesTable)
    .set({ downloadCount: share.downloadCount + 1 })
    .where(eq(sharesTable.token, token));

  res.json({
    dataUrl: file.dataUrl ?? null,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
  });
});

router.get("/share/:token/download", async (req, res) => {
  const token = req.params.token as string;
  const password = req.query.password as string | undefined;

  const [share] = await db.select().from(sharesTable).where(eq(sharesTable.token, token));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (share.expiresAt && share.expiresAt < new Date()) {
    res.status(410).json({ error: "Share link expired" });
    return;
  }

  if (!share.allowDownload) {
    res.status(403).json({ error: "Download not allowed" });
    return;
  }

  if (share.passwordHash) {
    if (!password) {
      res.status(401).json({ error: "Password required", requiresPassword: true });
      return;
    }
    const hash = hashSharePassword(password);
    if (hash !== share.passwordHash) {
      res.status(401).json({ error: "Invalid password" });
      return;
    }
  }

  const [file] = await db.select().from(filesTable).where(eq(filesTable.id, share.fileId));

  if (!file) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  await db.update(sharesTable)
    .set({ downloadCount: share.downloadCount + 1 })
    .where(eq(sharesTable.token, token));

  res.json({
    dataUrl: file.dataUrl ?? null,
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
  });
});

router.get("/share/:token/stats", requireAuth, async (req, res) => {
  const token = req.params.token as string;
  const [share] = await db.select().from(sharesTable)
    .where(and(eq(sharesTable.token, token), eq(sharesTable.ownerId, req.userId!)));

  if (!share) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({
    viewCount: share.viewCount,
    downloadCount: share.downloadCount,
    allowDownload: share.allowDownload,
    expiresAt: share.expiresAt?.toISOString() ?? null,
    hasPassword: !!share.passwordHash,
    createdAt: share.createdAt.toISOString(),
  });
});

export default router;
