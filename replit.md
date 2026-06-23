# Koshagar

A full-featured dark glassmorphism cloud storage web app — a Google Drive alternative named after the Bengali word for "treasury." Includes auth, file/folder management, sharing, search, trash, activity logs, and an admin panel.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/koshagar run dev` — run the frontend (port 21223, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session (cookie-based auth)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Wouter + TanStack Query + shadcn/ui + Framer Motion
- API codegen: Orval (from OpenAPI spec → `@workspace/api-client-react`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts (30+ endpoints)
- `lib/db/src/schema/` — Drizzle schema: users, files, folders, shares, activity tables
- `artifacts/api-server/src/routes/` — Express route handlers: auth, files, folders, share, activity, storage, admin
- `artifacts/api-server/src/middlewares/auth.ts` — `requireAuth` middleware, sets `req.userId` & `req.userRole`
- `artifacts/api-server/src/types.d.ts` — Express Request augmentation for `userId` and `userRole`
- `artifacts/koshagar/src/pages/` — All 14 pages: landing, login, register, drive/* (index, folder, starred, recent, trash, shared, search, activity, settings), admin/index, share/index
- `artifacts/koshagar/src/components/` — DriveLayout, FileGrid, FileCard, FileActionsMenu, modals (Upload, CreateFolder, Share)
- `artifacts/koshagar/src/contexts/auth.tsx` — Auth context using `useGetMe` hook
- `lib/api-client-react/src/custom-fetch.ts` — Custom fetch with `credentials: "include"` for session cookies

## Architecture decisions

- **Session auth** via express-session + cookie (not JWT). First registered user auto-gets `admin` role.
- **Password hashing**: SHA256 + static salt (demo-appropriate simplicity).
- **File storage**: API stores metadata only in DB; `storageKey` references object storage (not yet wired to actual blob storage — a future enhancement).
- **Quota**: Hardcoded 10 GB per user in the storage route.
- **`listFiles` folderId logic**: absent/empty/null → root (NULL folderId); numeric → filter by that folder ID.
- **Type augmentation**: `artifacts/api-server/src/types.d.ts` uses `declare namespace Express` (not module augmentation) for `req.userId` to work across all route files.

## Product

- Landing page with animated hero
- Auth: register, login, session-based
- Drive: file grid/list views, folder navigation, drag-to-upload
- File operations: star, trash, move, rename, share via link
- Views: Starred, Recent, Shared, Trash, Search
- Activity log with per-user history
- Settings: profile update, logout
- Admin panel: user management, system stats
- Public share page: view shared files by token

## Demo accounts

- Admin: `admin@koshagar.io` / `admin123` (role: admin)
- Demo user: `demo@koshagar.io` / `demo123` (role: user)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after any change to `lib/*` packages before checking leaf artifacts.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change.
- The `credentials: "include"` in `custom-fetch.ts` is essential for session cookies — do not remove it.
- `express-session` must be wired in `app.ts` before the routes for auth to work.
- Do NOT run `pnpm dev` at the workspace root — use `restart_workflow` instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
