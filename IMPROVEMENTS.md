# Koshagar — Production Readiness & Feature Roadmap

---

## 🚨 Critical Bugs (Logged Jun 25 2026 — now fixed)

These were identified during testing and have been resolved:

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | **Password-protected share shows "Unavailable"** | Backend now returns HTTP 200 with `requiresPassword: true` instead of 401; frontend uses custom `useQuery` fetcher with `?password=` param support |
| 2 | **Text files can't be edited** | Added `Edit` mode to file preview modal with a full textarea editor; new `PATCH /api/files/:id/content` backend endpoint |
| 3 | **File creation produces blank files** | Fixed — `Create File` modal always initialises content (template starter content per type); editor in preview allows immediate editing |
| 4 | **Only 4 file types in creation modal** | Expanded to 14 types (HTML, CSS, JS, TS, JSON, MD, TXT, CSV, YAML, XML, PY, SH, SQL, SVG) plus a "Custom extension" option |
| 5 | **File type selector shows plain text, no icons** | Replaced text labels with coloured monospace badge-style type icons per language |
| 6 | **Shared folder breadcrumb shows duplicate folder name** | Backend `browse` endpoint now builds ancestors-only breadcrumb (excludes current folder); current folder name shown separately once |
| 7 | **No way to download whole folders** | Added `GET /api/folders/:id/download-zip` (auth) and `GET /api/share/:token/download-zip` (public); both stream a recursive ZIP using archiver |
| 8 | **Long videos crash / load entire file** | Video viewer now uses `preload="metadata"` to avoid loading the full file; blob URL conversion is lazy |
| 9 | **Admin sidebar bottom elements scroll off screen** | Changed `min-h-screen` → `h-screen sticky top-0`; nav section is `overflow-y-auto` so content scrolls within a fixed viewport height |
| 10 | **File preview modal not fully responsive** | Improved layout for all viewers; PDF uses blob URL with toolbar; markdown has toggle-edit; code/text have Edit button |

---

## 🔜 Still Needed (Near-term, not yet implemented)

| # | Item | Notes |
|---|------|-------|
| 1 | **Video & PDF thumbnails** | Video thumbnails can be generated client-side by capturing the first frame via Canvas API on upload; PDF thumbnails require PDF.js integration |
| 2 | **Real object storage (S3/R2/GCS)** | Files stored as base64 data URLs in Postgres — works for small files but breaks for videos/large uploads; wire to real blob storage |
| 3 | **Streaming video playback** | Without real storage, large videos are decoded into memory; needs object storage + range-request support |
| 4 | **Drive folder "Download as ZIP" button** | ZIP endpoint exists on backend; need to add Download ZIP action to folder context menu in the drive |
| 5 | **Custom extension in file preview icon mapping** | Unknown extensions show a generic icon; could use extension-based fallback |

---



> A living document of everything needed to elevate Koshagar from a capable demo into a world-class, production-grade cloud storage platform. Organised by category, roughly prioritised within each section.

---

## 🔐 Security & Auth

| # | Item | Why |
|---|------|-----|
| 1 | **Replace SHA-256 + static salt with bcrypt/argon2** | Current hash is trivially crackable offline; bcrypt/argon2 is the industry standard |
| 2 | **CSRF protection** | Express sessions are vulnerable to cross-site request forgery without a CSRF token |
| 3 | **Rate limiting on auth endpoints** | Prevent brute-force on login/register (use `express-rate-limit`) |
| 4 | **OAuth 2.0 / SSO** | Google, GitHub sign-in removes password management burden |
| 5 | **Two-factor authentication (TOTP)** | Critical for admin accounts; nice-to-have for all users |
| 6 | **Email verification on register** | Prevents fake account creation |
| 7 | **Secure session config** | Set `cookie.secure`, `cookie.httpOnly`, `sameSite: "lax"`, short `maxAge`, and store sessions in Redis/Postgres (not in-memory) |
| 8 | **Audit log for admin actions** | Track who changed what in the admin panel |
| 9 | **Role-based access control (RBAC) expansion** | Beyond admin/user: introduce team roles (viewer, editor, admin) |
| 10 | **Content-Security-Policy & security headers** | Add `helmet.js` middleware |

---

## 🗄️ File Storage

| # | Item | Why |
|---|------|-----|
| 1 | **Wire real blob storage (S3 / R2 / GCS)** | Current `dataUrl` in Postgres kills DB performance at any scale; blobs belong in object storage |
| 2 | **Chunked / resumable uploads (TUS protocol)** | Large files fail on flaky connections without resumable upload |
| 3 | **Server-side streaming downloads** | Signed, expiring URLs from S3 instead of sending binary through Express |
| 4 | **Per-user storage quota enforcement** | Quota is currently hardcoded and not enforced on upload |
| 5 | **File deduplication (content-hashing)** | Avoid storing the same bytes twice; huge storage saving |
| 6 | **Virus / malware scanning** | Scan uploaded files with ClamAV or an external API before accepting |
| 7 | **Automatic image compression & WebP conversion** | Reduce bandwidth; serve srcset variants |
| 8 | **Video transcoding & preview generation** | Thumbnail frames, HLS streaming for video files |
| 9 | **Office document previews** | Render DOCX/XLSX/PPTX to PDF in-browser preview (LibreOffice, Gotenberg) |
| 10 | **ZIP download for folders** | Server-side ZIP stream of entire folder trees |

---

## ⚡ Performance

| # | Item | Why |
|---|------|-----|
| 1 | **Redis-backed session store** | In-memory sessions are lost on restart and don't scale horizontally |
| 2 | **Database connection pooling with PgBouncer** | Prevent connection exhaustion under load |
| 3 | **Pagination / cursor-based file listing** | Listing thousands of files in one query will OOM |
| 4 | **DB indexes on hot columns** | Add indexes on `(ownerId, folderId, trashed)`, `shareToken`, `createdAt DESC` |
| 5 | **API response caching (Redis)** | Cache storage-usage and activity counts (TTL ~60 s) |
| 6 | **Frontend code splitting** | Lazy-load admin panel, share page, file preview modals |
| 7 | **Virtual list for large file grids** | `react-virtual` prevents DOM bloat with thousands of files |
| 8 | **Service Worker + offline shell** | Cache the app shell and recent file metadata for offline access |
| 9 | **CDN for static assets** | Serve JS/CSS/images from edge (Cloudflare, Fastly) |
| 10 | **HTTP/2 push / preload links** | Critical-path CSS and fonts should be preloaded |

---

## 🤝 Collaboration & Sharing

| # | Item | Why |
|---|------|-----|
| 1 | **Real-time collaborative editing** (Yjs + WebSocket) | Google Docs-style live editing for text/markdown files |
| 2 | **Granular share permissions** | Read / comment / edit per-user or per-team, not just a single public link |
| 3 | **Share with internal users by email** | Share directly to another Koshagar account |
| 4 | **Public folder share: download-all as ZIP** | Expected by anyone who clicks "Download folder" |
| 5 | **Comments on files** | Threaded comments with @mentions and notifications |
| 6 | **File version history** | Store previous versions, diff view, one-click restore |
| 7 | **Team / organisation workspaces** | Shared quota pool, team folders, member management |
| 8 | **Real-time presence indicators** | Show who else is viewing a file/folder right now |
| 9 | **Request files** | Generate a link that lets anyone upload to a specific folder without an account |
| 10 | **Share link analytics dashboard** | Detailed view-counts, geos, referrers per share link |

---

## 🖥️ User Experience

| # | Item | Why |
|---|------|-----|
| 1 | **File preview modal** | In-browser preview for images, PDF, video, audio, markdown, code |
| 2 | **Keyboard shortcuts** | Power-user shortcuts: `U` upload, `N` new folder, `/` search, `Del` trash, etc. |
| 3 | **Drag-to-move files between folders** | Currently only drag-to-upload; in-drive drag-and-drop rearrangement |
| 4 | **Multi-select with checkbox** | Select multiple files → batch trash / move / download / share |
| 5 | **Right-click context menu** | Native feel on desktop |
| 6 | **Breadcrumb drag-drop targets** | Drop files onto a breadcrumb crumb to move them |
| 7 | **Search with filters** | Filter by type, date range, size, owner, star status |
| 8 | **Sort controls** | Sort by name / size / date modified / type in both grid and list |
| 9 | **List view column customisation** | Toggle/resize columns (name, size, modified, shared status) |
| 10 | **Inline rename** | Double-click filename to rename in-place instead of a modal |
| 11 | **Undo / redo** | Ctrl+Z to undo the last file operation (trash, move, rename) |
| 12 | **Empty-trash confirmation with count** | "Permanently delete 12 items?" prevents accidents |
| 13 | **Onboarding tour** | Step-by-step walkthrough on first login |
| 14 | **Responsive / mobile-first UI** | Current layout breaks on small screens |
| 15 | **Dark / light mode toggle** | Currently dark-only; add a theme toggle |

---

## 📱 Mobile & Desktop Apps

| # | Item | Why |
|---|------|-----|
| 1 | **Progressive Web App (PWA) manifest + install prompt** | "Add to home screen" without a separate app |
| 2 | **Expo / React Native mobile app** | Native experience on iOS & Android |
| 3 | **Desktop sync client (Electron / Tauri)** | Watch a local folder and sync changes, like Dropbox |
| 4 | **Camera upload from mobile** | Auto-backup photos from phone |

---

## 🔔 Notifications & Integrations

| # | Item | Why |
|---|------|-----|
| 1 | **Email notifications** | "File shared with you", "Download limit reached", "Storage 80% full" |
| 2 | **In-app real-time notification centre** | WebSocket push for events (currently polling) |
| 3 | **Webhook support** | Trigger external systems on upload/share events |
| 4 | **Zapier / Make integration** | No-code automation for file events |
| 5 | **Slack / Teams notifications** | Alert a channel on certain file events |
| 6 | **Calendar integration** | Attach files to calendar events |

---

## 🤖 AI Features

| # | Item | Why |
|---|------|-----|
| 1 | **AI-powered search** | Semantic search ("find the invoice from last month") instead of filename-only |
| 2 | **Auto-tagging & classification** | Detect document type, people, dates from content |
| 3 | **Document summarisation** | One-click summary for long PDFs / markdown files |
| 4 | **Smart duplicate detection** | Flag visually similar images or near-duplicate documents |
| 5 | **OCR on images / scanned PDFs** | Make text searchable inside images |
| 6 | **AI file naming suggestions** | Suggest a better filename based on content |

---

## 🛠️ Admin & Operations

| # | Item | Why |
|---|------|-----|
| 1 | **Prometheus / OpenTelemetry metrics** | Request latency, error rate, upload throughput |
| 2 | **Structured logging (pino/winston)** | JSON logs with request IDs for log aggregation |
| 3 | **Health-check endpoint** | `GET /health` with DB + storage connectivity check |
| 4 | **Graceful shutdown** | Drain in-flight requests before SIGTERM |
| 5 | **Database migrations with rollback** | Drizzle Kit migrations committed to version control |
| 6 | **Admin: per-user storage reclaim** | Admin can clear a user's trash, reassign quota |
| 7 | **Admin: impersonate user** | Support can debug issues by viewing as a specific user |
| 8 | **Admin: system-wide announcements** | Banner shown to all users (planned downtime, new features) |
| 9 | **Backup & point-in-time restore** | Automated Postgres backups + blob storage versioning |
| 10 | **Multi-region deployment** | Edge nodes in US, EU, APAC for low latency globally |

---

## 🧪 Testing & Quality

| # | Item | Why |
|---|------|-----|
| 1 | **API integration tests (Vitest + supertest)** | Every endpoint needs a happy-path + error-path test |
| 2 | **Frontend component tests (Testing Library)** | Catch regressions in modals, file card actions |
| 3 | **End-to-end tests (Playwright)** | Upload → share → download full flow automated |
| 4 | **CI pipeline (GitHub Actions)** | Type-check, lint, unit + e2e tests on every PR |
| 5 | **Error monitoring (Sentry)** | Catch and alert on unhandled exceptions in prod |
| 6 | **Load testing (k6 / artillery)** | Verify system holds under 1 000 concurrent users |

---

## 💰 Monetisation

| # | Item | Why |
|---|------|-----|
| 1 | **Tiered plans** (Free 5 GB / Pro 100 GB / Team 1 TB) | Sustainable revenue; aligns with storage cost |
| 2 | **Stripe billing integration** | Subscription management, usage-based overages |
| 3 | **Usage analytics per plan** | Show users their storage, share, and download usage |

---

## 📋 Quick Wins (ship in < 1 day each)

- [ ] Add `helmet.js` for security headers
- [ ] Add `express-rate-limit` on `/api/auth/*`
- [ ] Move session store to `connect-pg-simple`
- [ ] Add DB indexes (SQL migration)
- [ ] Add `GET /health` route
- [ ] Add keyboard shortcut `U` → open upload modal
- [ ] Add sort controls (name / date / size) to file grid
- [ ] Right-click context menu on file cards
- [ ] "Download all as ZIP" button on shared folder page
- [ ] Light mode theme toggle
