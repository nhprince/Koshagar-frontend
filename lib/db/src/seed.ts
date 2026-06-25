import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;
const {
  usersTable, filesTable, sharesTable, activityTable,
} = schema;

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

function hashPassword(p: string) {
  return crypto.createHash("sha256").update(p + "koshagar_salt").digest("hex");
}

function token() {
  return crypto.randomBytes(16).toString("hex");
}

const NOW = new Date();
const ago = (d: number) => new Date(NOW.getTime() - d * 86400_000);

// ── tiny placeholder thumbnails (coloured 1×1 px data-URLs) ──────────────────
const RED_PX   = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
const BLUE_PX  = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
const GREEN_PX = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// ── text file data-URLs ───────────────────────────────────────────────────────
const txtDataUrl = (content: string) =>
  "data:text/plain;base64," + Buffer.from(content).toString("base64");
const jsonDataUrl = (obj: object) =>
  "data:application/json;base64," + Buffer.from(JSON.stringify(obj, null, 2)).toString("base64");
const csvDataUrl = (content: string) =>
  "data:text/csv;base64," + Buffer.from(content).toString("base64");
const mdDataUrl = (content: string) =>
  "data:text/markdown;base64," + Buffer.from(content).toString("base64");

async function seed() {
  console.log("🌱  Clearing old demo data…");

  // wipe in safe order (activity → shares → files → users)
  await db.delete(activityTable);
  await db.delete(sharesTable);
  await db.delete(filesTable);
  await db.delete(usersTable);

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log("👤  Creating users…");
  const [admin] = await db.insert(usersTable).values({
    email: "admin@koshagar.io",
    passwordHash: hashPassword("admin123"),
    name: "Alex Admin",
    role: "admin",
    lastActiveAt: ago(0),
  }).returning();

  const [demo] = await db.insert(usersTable).values({
    email: "demo@koshagar.io",
    passwordHash: hashPassword("demo123"),
    name: "Dana Demo",
    role: "user",
    lastActiveAt: ago(1),
  }).returning();

  const [bob] = await db.insert(usersTable).values({
    email: "bob@koshagar.io",
    passwordHash: hashPassword("bob123"),
    name: "Bob Builder",
    role: "user",
    lastActiveAt: ago(3),
  }).returning();

  // ── Admin's folders & files ───────────────────────────────────────────────
  console.log("📁  Building admin file tree…");

  // Root-level folders
  const [projects] = await db.insert(filesTable).values({
    name: "Projects", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, ownerId: admin.id, createdAt: ago(30), updatedAt: ago(5),
  }).returning();

  const [design] = await db.insert(filesTable).values({
    name: "Design Assets", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, ownerId: admin.id, createdAt: ago(25), updatedAt: ago(2),
  }).returning();

  const [archive] = await db.insert(filesTable).values({
    name: "Archive", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, ownerId: admin.id, createdAt: ago(90), updatedAt: ago(60),
  }).returning();

  // Projects sub-folders
  const [koshagar] = await db.insert(filesTable).values({
    name: "Koshagar", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, folderId: projects.id, ownerId: admin.id, createdAt: ago(20), updatedAt: ago(1),
  }).returning();

  const [marketing] = await db.insert(filesTable).values({
    name: "Marketing", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, folderId: projects.id, ownerId: admin.id, createdAt: ago(15), updatedAt: ago(4),
  }).returning();

  // Design sub-folders
  const [icons] = await db.insert(filesTable).values({
    name: "Icons", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, folderId: design.id, ownerId: admin.id, createdAt: ago(18), updatedAt: ago(3),
  }).returning();

  // ── Files in root ──────────────────────────────────────────────────────────
  await db.insert(filesTable).values([
    {
      name: "README.md", type: "file", mimeType: "text/markdown",
      size: 512, ownerId: admin.id, starred: true,
      dataUrl: mdDataUrl("# Koshagar\n\nWelcome to your cloud treasury.\n\n## Features\n- Upload & organise files\n- Share with password protection\n- Trash & restore\n"),
      createdAt: ago(28), updatedAt: ago(2),
    },
    {
      name: "System Config.json", type: "file", mimeType: "application/json",
      size: 1024, ownerId: admin.id,
      dataUrl: jsonDataUrl({ version: "1.0", debug: false, maxUploadMb: 100, featureFlags: { folderShare: true, activityLog: true } }),
      createdAt: ago(20), updatedAt: ago(10),
    },
    {
      name: "Budget 2025.csv", type: "file", mimeType: "text/csv",
      size: 2048, ownerId: admin.id, starred: true,
      dataUrl: csvDataUrl("Category,Q1,Q2,Q3,Q4\nInfrastructure,12000,13500,11000,14000\nMarketing,8000,9000,10000,12000\nPersonnel,45000,45000,47000,47000\n"),
      createdAt: ago(14), updatedAt: ago(7),
    },
    {
      name: "Welcome Note.txt", type: "file", mimeType: "text/plain",
      size: 256, ownerId: admin.id,
      dataUrl: txtDataUrl("Welcome to Koshagar!\n\nThis is a demo environment loaded with sample data.\nFeel free to create folders, upload files, share links and explore all features.\n"),
      createdAt: ago(1), updatedAt: ago(0),
    },
  ]);

  // ── Files in Projects/Koshagar ─────────────────────────────────────────────
  await db.insert(filesTable).values([
    {
      name: "Product Roadmap.md", type: "file", mimeType: "text/markdown",
      size: 3072, folderId: koshagar.id, ownerId: admin.id, starred: true,
      dataUrl: mdDataUrl("# Product Roadmap\n\n## Q1 2026\n- [x] Multi-file upload\n- [x] Folder sharing\n- [ ] Real-time collaboration\n\n## Q2 2026\n- [ ] Mobile app\n- [ ] End-to-end encryption\n"),
      createdAt: ago(10), updatedAt: ago(1),
    },
    {
      name: "API Spec.json", type: "file", mimeType: "application/json",
      size: 8192, folderId: koshagar.id, ownerId: admin.id,
      dataUrl: jsonDataUrl({ openapi: "3.0.0", info: { title: "Koshagar API", version: "1.0.0" }, paths: {} }),
      createdAt: ago(8), updatedAt: ago(3),
    },
    {
      name: "Sprint Notes.txt", type: "file", mimeType: "text/plain",
      size: 1024, folderId: koshagar.id, ownerId: admin.id,
      dataUrl: txtDataUrl("Sprint 12 — June 2026\n\nCompleted:\n- Folder share browsing\n- Per-file upload progress\n- Image thumbnails\n\nNext:\n- File versioning\n- Real-time notifications\n"),
      createdAt: ago(2), updatedAt: ago(0),
    },
  ]);

  // ── Files in Projects/Marketing ───────────────────────────────────────────
  await db.insert(filesTable).values([
    {
      name: "Campaign Brief.md", type: "file", mimeType: "text/markdown",
      size: 2048, folderId: marketing.id, ownerId: admin.id,
      dataUrl: mdDataUrl("# Launch Campaign\n\nTarget: developers & small teams\nChannels: Twitter, Hacker News, ProductHunt\nTimeline: 6 weeks\n"),
      createdAt: ago(12), updatedAt: ago(6),
    },
    {
      name: "Metrics.csv", type: "file", mimeType: "text/csv",
      size: 1536, folderId: marketing.id, ownerId: admin.id,
      dataUrl: csvDataUrl("Week,Signups,DAU,Churn\n1,42,18,2\n2,89,41,3\n3,134,78,5\n4,201,121,8\n"),
      createdAt: ago(5), updatedAt: ago(1),
    },
  ]);

  // ── Files in Design Assets ─────────────────────────────────────────────────
  const [logo] = await db.insert(filesTable).values({
    name: "Logo Red.png", type: "file", mimeType: "image/png",
    size: 4096, folderId: design.id, ownerId: admin.id, starred: true,
    thumbnailUrl: RED_PX, dataUrl: RED_PX,
    createdAt: ago(20), updatedAt: ago(20),
  }).returning();

  const [logoBlu] = await db.insert(filesTable).values({
    name: "Logo Blue.png", type: "file", mimeType: "image/png",
    size: 4096, folderId: design.id, ownerId: admin.id,
    thumbnailUrl: BLUE_PX, dataUrl: BLUE_PX,
    createdAt: ago(19), updatedAt: ago(19),
  }).returning();

  await db.insert(filesTable).values({
    name: "Brand Green.png", type: "file", mimeType: "image/png",
    size: 2048, folderId: icons.id, ownerId: admin.id,
    thumbnailUrl: GREEN_PX, dataUrl: GREEN_PX,
    createdAt: ago(10), updatedAt: ago(10),
  });

  await db.insert(filesTable).values({
    name: "Style Guide.md", type: "file", mimeType: "text/markdown",
    size: 5120, folderId: design.id, ownerId: admin.id,
    dataUrl: mdDataUrl("# Style Guide\n\n## Colours\n- Primary: `#7c3aed`\n- Accent: `#06b6d4`\n- Background: `#09090b`\n\n## Typography\n- Font: Inter\n- Headings: 700\n- Body: 400\n"),
    createdAt: ago(15), updatedAt: ago(8),
  });

  // ── Trashed file ──────────────────────────────────────────────────────────
  await db.insert(filesTable).values({
    name: "Old Proposal.txt", type: "file", mimeType: "text/plain",
    size: 800, ownerId: admin.id, trashed: true, trashedAt: ago(3),
    dataUrl: txtDataUrl("Draft proposal — superseded. Do not use."),
    createdAt: ago(30), updatedAt: ago(3),
  });

  // ── Demo user's file tree ─────────────────────────────────────────────────
  console.log("📁  Building demo user file tree…");

  const [myDocs] = await db.insert(filesTable).values({
    name: "My Documents", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, ownerId: demo.id, createdAt: ago(10), updatedAt: ago(1),
  }).returning();

  const [myPhotos] = await db.insert(filesTable).values({
    name: "Photos", type: "folder", mimeType: "application/vnd.koshagar.folder",
    size: 0, ownerId: demo.id, createdAt: ago(8), updatedAt: ago(0),
  }).returning();

  await db.insert(filesTable).values([
    {
      name: "Personal Notes.txt", type: "file", mimeType: "text/plain",
      size: 640, folderId: myDocs.id, ownerId: demo.id, starred: true,
      dataUrl: txtDataUrl("Meeting notes:\n- Discuss roadmap with team\n- Review Q2 metrics\n- Plan design sprint\n"),
      createdAt: ago(3), updatedAt: ago(0),
    },
    {
      name: "Expenses.csv", type: "file", mimeType: "text/csv",
      size: 1280, folderId: myDocs.id, ownerId: demo.id,
      dataUrl: csvDataUrl("Date,Description,Amount\n2026-06-01,Lunch,12.50\n2026-06-03,Transport,8.00\n2026-06-05,Coffee,4.50\n"),
      createdAt: ago(5), updatedAt: ago(2),
    },
    {
      name: "Vacation.png", type: "file", mimeType: "image/png",
      size: 51200, folderId: myPhotos.id, ownerId: demo.id, starred: true,
      thumbnailUrl: GREEN_PX, dataUrl: GREEN_PX,
      createdAt: ago(1), updatedAt: ago(1),
    },
    {
      name: "Screenshot.png", type: "file", mimeType: "image/png",
      size: 28672, folderId: myPhotos.id, ownerId: demo.id,
      thumbnailUrl: BLUE_PX, dataUrl: BLUE_PX,
      createdAt: ago(0), updatedAt: ago(0),
    },
  ]);

  // ── Shares ────────────────────────────────────────────────────────────────
  console.log("🔗  Creating shares…");

  const sharedReadme = await db.select().from(filesTable)
    .where(eq(filesTable.name, "README.md"));
  const sharedRoadmap = await db.select().from(filesTable)
    .where(eq(filesTable.name, "Product Roadmap.md"));

  if (sharedReadme[0]) {
    const t = token();
    await db.update(filesTable).set({ shareToken: t }).where(eq(filesTable.id, sharedReadme[0].id));
    await db.insert(sharesTable).values({
      token: t, fileId: sharedReadme[0].id, ownerId: admin.id,
      allowDownload: true, viewCount: 24, downloadCount: 6,
    });
  }

  if (sharedRoadmap[0]) {
    const t = token();
    await db.update(filesTable).set({ shareToken: t }).where(eq(filesTable.id, sharedRoadmap[0].id));
    await db.insert(sharesTable).values({
      token: t, fileId: sharedRoadmap[0].id, ownerId: admin.id,
      allowDownload: false, viewCount: 9, downloadCount: 0,
    });
  }

  // Share the Projects folder
  const t3 = token();
  await db.update(filesTable).set({ shareToken: t3 }).where(eq(filesTable.id, projects.id));
  await db.insert(sharesTable).values({
    token: t3, fileId: projects.id, ownerId: admin.id,
    allowDownload: true, viewCount: 5, downloadCount: 2,
  });

  // Share the Logo for demo user too
  const t4 = token();
  await db.update(filesTable).set({ shareToken: t4 }).where(eq(filesTable.id, logo.id));
  await db.insert(sharesTable).values({
    token: t4, fileId: logo.id, ownerId: admin.id,
    allowDownload: true, viewCount: 14, downloadCount: 7,
  });

  // ── Activity log ──────────────────────────────────────────────────────────
  console.log("📋  Seeding activity log…");

  const acts = [
    { action: "upload" as const, fileName: "README.md",           userId: admin.id, createdAt: ago(28) },
    { action: "upload" as const, fileName: "Budget 2025.csv",     userId: admin.id, createdAt: ago(14) },
    { action: "star"   as const, fileName: "README.md",           userId: admin.id, createdAt: ago(14) },
    { action: "upload" as const, fileName: "Product Roadmap.md",  userId: admin.id, createdAt: ago(10) },
    { action: "share"  as const, fileName: "README.md",           userId: admin.id, createdAt: ago(9)  },
    { action: "upload" as const, fileName: "Logo Red.png",        userId: admin.id, createdAt: ago(8)  },
    { action: "share"  as const, fileName: "Product Roadmap.md",  userId: admin.id, createdAt: ago(7)  },
    { action: "rename" as const, fileName: "API Spec.json",       userId: admin.id, createdAt: ago(6)  },
    { action: "star"   as const, fileName: "Budget 2025.csv",     userId: admin.id, createdAt: ago(5)  },
    { action: "upload" as const, fileName: "Metrics.csv",         userId: admin.id, createdAt: ago(5)  },
    { action: "trash"  as const, fileName: "Old Proposal.txt",    userId: admin.id, createdAt: ago(3)  },
    { action: "share"  as const, fileName: "Projects",            userId: admin.id, createdAt: ago(2)  },
    { action: "upload" as const, fileName: "Sprint Notes.txt",    userId: admin.id, createdAt: ago(2)  },
    { action: "upload" as const, fileName: "Welcome Note.txt",    userId: admin.id, createdAt: ago(1)  },
    { action: "upload" as const, fileName: "Personal Notes.txt",  userId: demo.id,  createdAt: ago(3)  },
    { action: "star"   as const, fileName: "Personal Notes.txt",  userId: demo.id,  createdAt: ago(3)  },
    { action: "upload" as const, fileName: "Expenses.csv",        userId: demo.id,  createdAt: ago(2)  },
    { action: "upload" as const, fileName: "Vacation.png",        userId: demo.id,  createdAt: ago(1)  },
    { action: "star"   as const, fileName: "Vacation.png",        userId: demo.id,  createdAt: ago(1)  },
    { action: "upload" as const, fileName: "Screenshot.png",      userId: demo.id,  createdAt: ago(0)  },
  ];

  for (const a of acts) {
    await db.insert(activityTable).values(a);
  }

  console.log("✅  Seed complete.\n");
  console.log("  Admin  → admin@koshagar.io  / admin123  (role: admin)");
  console.log("  Demo   → demo@koshagar.io   / demo123   (role: user)");
  console.log("  Bob    → bob@koshagar.io    / bob123    (role: user)");
}

seed()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => pool.end());
