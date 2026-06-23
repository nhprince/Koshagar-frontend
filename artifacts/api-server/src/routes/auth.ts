import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "koshagar_salt").digest("hex");
}

function toPublicUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/auth/me", requireAuth, async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(toPublicUser(user));
});

router.post("/auth/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: "email, password, and name are required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const isFirstUser = (await db.select().from(usersTable)).length === 0;
  const [user] = await db.insert(usersTable).values({
    email,
    passwordHash: hashPassword(password),
    name,
    role: isFirstUser ? "admin" : "user",
  }).returning();

  (req as any).session = (req as any).session || {};
  (req as any).session.userId = user.id;
  (req as any).session.userRole = user.role;

  res.status(201).json({ user: toPublicUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  await db.update(usersTable).set({ lastActiveAt: new Date() }).where(eq(usersTable.id, user.id));

  (req as any).session = (req as any).session || {};
  (req as any).session.userId = user.id;
  (req as any).session.userRole = user.role;

  res.json({ user: toPublicUser(user) });
});

router.post("/auth/logout", (req, res) => {
  if ((req as any).session) {
    (req as any).session.userId = undefined;
    (req as any).session.userRole = undefined;
  }
  res.json({ ok: true });
});

router.patch("/auth/profile", requireAuth, async (req, res) => {
  const { name, avatarUrl } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (name !== undefined) updates.name = name;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId!)).returning();
  res.json(toPublicUser(user));
});

export default router;
