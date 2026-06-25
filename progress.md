# Koshagar — Project Progress

A full-featured dark glassmorphism cloud storage web app (Google Drive alternative). Built with Express 5 + Drizzle ORM + React + Vite + shadcn/ui + Framer Motion.

---

## What Was Built

### Core Infrastructure
- **pnpm workspace monorepo** with TypeScript 5.9 across all packages
- **PostgreSQL + Drizzle ORM** schema: users, files, folders, shares, activity tables
- **Express 5 API server** (port 8080) with session-based cookie auth
- **React + Vite frontend** (port 21223) with Wouter routing + TanStack Query
- **OpenAPI spec** (`lib/api-spec/openapi.yaml`) as source of truth → Orval codegen → typed React hooks
- **Vite dev proxy** for `/api` → port 8080 (enables relative API URLs and `<video>` streaming)

---

## Features Implemented

### Authentication
- Register / Login with session cookie (express-session)
- First registered user auto-gets `admin` role
- Password hashing: SHA256 + salt
- Auth context (`useGetMe`) used throughout the app
- Protected routes redirect to login

### Landing Page
- Animated hero section with Framer Motion
- Feature highlights, CTA buttons
- Glassmorphism design system

### Drive (File & Folder Management)
- **File grid / list views** with sort controls
- **Folder navigation** with breadcrumb trail
- **Drag-to-upload** on the drive page (drops files directly into the upload modal)
- **File operations:**
  - Upload (single & multi-file with progress bars)
  - Star / unstar
  - Rename
  - Move to folder
  - Trash / restore
  - Empty trash
  - Download (fetches `dataUrl` from API, triggers browser download)
  - Download folder as ZIP (client-side button + server-side `archiver` bundling)
- **Context menus** (right-click / three-dot) with full action set
- **Folder cards** navigate on click; file cards open preview modal
- Card click propagation handled via `data-no-card-click` / `data-no-row-click` attribute pattern

### File Creation Modal
- 14 built-in file types with colored `TypeIcon` badges (HTML, CSS, JS, TS, JSON, MD, TXT, CSV, YAML, XML, PY, SH, SQL, SVG)
- Custom extension option with alphanumeric input
- Each type has appropriate starter content and MIME type
- File name input with live extension suffix display

### File Preview Modal
- **Images** — zoom in/out (0.25x steps), reset, Framer Motion fade-in
- **Videos** — streamed via `GET /api/files/:id/stream` with HTTP Range request support (no full-blob loading)
- **Audio** — blob URL player with album-art style UI
- **PDFs** — rendered in iframe with blob URL
- **Text / Code / Markdown** — syntax-highlighted display + Edit / Save / Cancel with `PATCH /api/files/:id/content`
- **Other** — placeholder with file type icon and metadata

### Upload Modal
- Multi-file drag-and-drop or browse
- Per-file progress bar (reading → uploading → done/error)
- **Video thumbnail generation** — on upload, a hidden `<video>` + canvas captures the first frame (at 10% of duration) and stores it as a JPEG `thumbnailUrl` in the DB
- Image thumbnails stored automatically from `dataUrl` on upload

### Sharing System
- **Create share link** with options:
  - Allow download toggle
  - Link expiry (1 day / 7 days / 30 days / never)
  - Password protection (hashed with SHA256 + salt)
- **Manage existing share:**
  - Toggle download permission live
  - Update expiry
  - Add / change / remove password
  - View stats (view count, download count)
  - Revoke link
- **Public share page** (`/s/:token`):
  - Detects password-protected shares → shows password form
  - Wrong password → error + retry
  - Correct password → unlocks file view
  - Folder shares → browse subfolder tree with breadcrumb navigation
  - Download individual files or full folder as ZIP (password forwarded in query)
  - Breadcrumb deduplication fixed (subfolder = root folder → treated as root/null)

### Views
- **My Drive** — root file/folder grid
- **Folder view** — scoped to folder with breadcrumb
- **Starred** — files with `starred: true`
- **Recent** — last 20 files by `updatedAt`
- **Shared** — files with a `shareToken`
- **Trash** — trashed files with restore / permanent delete
- **Search** — debounced search across file names

### Activity Log
- Per-user history of: upload, rename, star, trash, restore, move, share, delete
- Logged automatically on every file operation
- Paginated activity feed in the UI

### Settings
- Profile update (name, email)
- Logout

### Admin Panel
- **Dashboard** — system stats (total users, files, storage used, shares)
- **User management** — list all users, edit profile, allocate storage quota, send reset link, toggle role
- **Activity log** — admin-scoped view of all users' activity
- **Sidebar layout** fixed with `min-h-0` (prevented overflow clipping)

---

## API Endpoints (30+)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| PATCH | `/api/auth/profile` | Update profile |
| GET | `/api/files` | List files (filter: folder, starred, trash, search) |
| GET | `/api/files/recent` | Recent 20 files |
| GET | `/api/files/shared` | Files with share tokens |
| POST | `/api/files/upload` | Upload file (with optional thumbnailUrl) |
| DELETE | `/api/files/empty-trash` | Permanently delete all trashed files |
| GET | `/api/files/:id` | Get file with dataUrl |
| GET | `/api/files/:id/stream` | Stream file with Range request support (206 Partial Content) |
| PATCH | `/api/files/:id` | Rename file |
| PATCH | `/api/files/:id/content` | Update file content (text editing) |
| PATCH | `/api/files/:id/star` | Star/unstar |
| PATCH | `/api/files/:id/trash` | Trash/restore |
| PATCH | `/api/files/:id/move` | Move to folder |
| DELETE | `/api/files/:id` | Delete file |
| GET | `/api/folders` | List folders |
| POST | `/api/folders` | Create folder |
| GET | `/api/folders/:id` | Get folder detail + children |
| GET | `/api/folders/:id/download-zip` | Download folder as ZIP |
| DELETE | `/api/folders/:id` | Delete folder |
| POST | `/api/share` | Create share link |
| GET | `/api/share/:token` | Get public share (supports ?password=) |
| PATCH | `/api/share/:token` | Update share settings |
| DELETE | `/api/share/:token` | Revoke share |
| GET | `/api/share/:token/stats` | Share view/download counts |
| GET | `/api/share/:token/browse` | Browse shared folder (supports ?password=&subfolderId=) |
| GET | `/api/share/:token/download-zip` | ZIP download for shared folder |
| GET | `/api/activity` | User activity log (paginated) |
| GET | `/api/storage/usage` | Storage quota usage |
| GET | `/api/admin/stats` | Admin system stats |
| GET | `/api/admin/users` | All users (admin only) |
| GET | `/api/admin/activity` | All activity (admin only) |

---

## Bug Fixes & Polish

| # | Issue | Fix |
|---|-------|-----|
| 1 | Folder card click opened preview instead of navigating | Removed `Link` wrapper; used `data-no-card-click` + `setLocation` |
| 2 | Notification panel / dropdown menus semi-transparent | `style={{ background: "hsl(var(--card))" }}` inline (glass-card has 60% opacity) |
| 3 | Admin sidebar scrollable area clipped | Added `min-h-0` to `<nav>` in `admin-layout.tsx` |
| 4 | Breadcrumb showed root folder name duplicated in shared folder browse | Added `normalizedSubfolderId` in `share.ts` browse endpoint |
| 5 | `archiver` CJS/ESM import crash in Node 24 | Changed to `import * as archiverLib from "archiver"` + `.default ?? archiverLib` fallback |
| 6 | File download was a stub toast | Now fetches `dataUrl` from `GET /api/files/:id` and triggers anchor download |
| 7 | Video preview loaded entire base64 blob into browser memory | Replaced with streaming endpoint (`GET /api/files/:id/stream`) using HTTP Range requests |
| 8 | No Vite proxy — relative `/api/` URLs didn't reach the API server | Added `server.proxy` in `vite.config.ts` → port 8080 |

---

## Seed Data

Running `pnpm --filter @workspace/db run seed` creates:

**Users:**
- `admin@koshagar.io` / `admin123` (role: admin)
- `demo@koshagar.io` / `demo123` (role: user)
- `bob@koshagar.io` / `bob123` (role: user)

**File tree:** Folders (Projects, Design, Reports), files (README.md, Budget 2025.csv, Logo Red.png, Product Roadmap.md, Sprint Notes.txt, etc.), trashed file, starred files.

**Shares:**
- `README.md` — public share (24 views, 6 downloads)
- `Product Roadmap.md` — public share, download disabled
- `Projects` folder — public folder share
- `Logo Red.png` — public share (14 views)
- `Budget 2025.csv` — **password-protected share** (password: `budget2025`) — for testing the password flow at `/s/<token>`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24, TypeScript 5.9 |
| Package manager | pnpm workspaces |
| API server | Express 5 + express-session |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod (v4) + drizzle-zod |
| API contract | OpenAPI 3.0 → Orval codegen |
| Frontend | React + Vite + Wouter + TanStack Query |
| UI | shadcn/ui + Tailwind CSS v4 |
| Animations | Framer Motion |
| Build | esbuild (API CJS bundle) |
| File bundling | archiver (ZIP downloads) |

---

## File Structure

```
lib/
  api-spec/openapi.yaml       — OpenAPI source of truth
  api-client-react/           — Generated hooks + custom-fetch
  db/src/schema/              — Drizzle schema (users, files, folders, shares, activity)
  db/src/seed.ts              — Demo data seeder

artifacts/
  api-server/src/
    routes/                   — auth, files, folders, share, activity, storage, admin
    middlewares/auth.ts       — requireAuth middleware
    app.ts                    — Express setup (session, CORS, routes)
  koshagar/src/
    pages/                    — 14 pages (landing, login, register, drive/*, admin/*, share/*)
    components/
      drive/                  — DriveLayout, FileGrid, FileCard, FileActionsMenu
      layout/                 — AdminLayout, DriveLayout
      modals/                 — UploadModal, CreateFileModal, CreateFolderModal, ShareModal, FilePreviewModal
    contexts/auth.tsx         — Auth context
```
