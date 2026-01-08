# Codebase Snapshot Timeline

This document tracks the evolution of the Zenote codebase over time.

---

## Snapshot: 2026-01-07 at 12:00 UTC

**Author:** Claude (Opus 4.5)
**Captured:** 2026-01-07T12:00:00Z
**Commit:** 0c34982 (main branch)

### Architecture Overview

The Zenote application follows a layered architecture pattern:

**ZENOTE ARCHITECTURE (React SPA with Supabase Backend)**

PRESENTATION LAYER
- Core Views: LandingPage (Split-view), ChapteredLibrary (Temporal Grid), Editor (Rich Text)
- HeaderShell provides consistent header across all views
- UI Components: NoteCard, TagPill, TagBadge, WhisperBack, SyncIndicator
- Navigation: ChapterNav (Desktop), TimeRibbon (Mobile), TagFilterBar, EditorToolbar

MODAL COMPONENTS
- SettingsModal (Profile), TagModal (Create/Edit), ShareModal (Share Links)
- LettingGoModal (Offboarding), ConflictModal (Sync Conflict Resolution)

STATE MANAGEMENT
- App.tsx: Notes, Tags, UI State, Real-time Subscriptions
- AuthContext: User session, OAuth, Password reset, Offboarding

SERVICE LAYER
- notes.ts: CRUD operations, Soft delete (Faded Notes), Share links, Batch operations
- tags.ts: CRUD operations, Color management
- offlineNotes.ts: Offline-aware note CRUD with sync queue (WIP)
- offlineTags.ts: Offline-aware tag operations (WIP)
- syncEngine.ts: Queue processor, conflict detection, sync (WIP)

LIB LAYER
- supabase.ts: Supabase client instance
- offlineDb.ts: Dexie IndexedDB schema for offline storage

HOOKS
- useNetworkStatus: Network connectivity monitoring (singleton pattern)
- useSyncEngine: Sync engine React integration, conflict resolution
- useSyncStatus: Sync state for UI (pending count, online status)

UTILITY LAYER
- sanitize (XSS), exportImport (Backup), formatTime (Relative)
- temporalGrouping, withRetry (Network), lazyWithRetry (Smart Chunk Loading)

EXTERNAL SERVICES
- Supabase: PostgreSQL (Database), Auth (OAuth+PW), Real-time (Sync), RLS (Security)
- Vercel: Hosting + CDN
- Sentry: Error Monitoring

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend Framework** | React | 19.2.0 |
| **Language** | TypeScript | 5.9.3 |
| **Build Tool** | Vite | 7.2.4 |
| **Styling** | Tailwind CSS | 4.1.17 |
| **Rich Text Editor** | Tiptap (ProseMirror) | 3.13.0 |
| **Layout** | react-masonry-css | 1.0.16 |
| **Backend/Database** | Supabase | 2.86.2 |
| **Offline Storage** | Dexie (IndexedDB) | 4.2.1 |
| **Error Monitoring** | Sentry | 10.30.0 |
| **Notifications** | react-hot-toast | 2.6.0 |
| **XSS Prevention** | DOMPurify | 3.3.1 |
| **Unit Testing** | Vitest | 4.0.15 |
| **E2E Testing** | Playwright | 1.57.0 |
| **Linting** | ESLint | 9.39.1 |

### Production Deployment

- **Platform:** Vercel (auto-deploys from main branch)
- **Live URL:** https://zenote.vercel.app
- **Repository:** https://github.com/anbuneel/zenote
- **CI/CD:** GitHub Actions (typecheck, lint, test, build)
- **PWA:** Yes (installable, offline app shell, font caching)
- **CDN:** Vercel Edge Network

### Code Metrics

| Metric | Count |
|--------|-------|
| **Total Lines of Code** | 26,335 |
| TypeScript/TSX (src/) | 23,384 |
| CSS (src/) | 891 |
| E2E Tests (e2e/) | 1,473 |
| SQL Migrations | 370 |
| Build Scripts | 217 |
| **Source Files** | |
| React Components | 32 |
| Component Tests | 8 |
| Utility/Service Tests | 9 |
| E2E Spec Files | 6 |
| Theme Configs | 6 |
| **Build Status** | |
| Status | ⚠️ TypeScript errors (offline services WIP) |

*Note: Bundle metrics from v1.9.10 (last successful build):*
| **Bundle Size (Optimized)** | |
|--------|-------|
| Initial JS Bundle | 333 KB |
| Editor Chunk (lazy) | 407 KB |
| Vendor Supabase (lazy) | 185 KB |
| Vendor Sentry (lazy) | 18 KB |
| Vendor React (lazy) | 4 KB |
| Total JS | 994 KB |
| Total CSS | 45 KB |

### Component Inventory

**Core Views (6):**
- LandingPage - Split-screen hero with interactive demo
- ChapteredLibrary - Temporal note organization (Pinned, This Week, etc.)
- Editor - Rich text editing with Tiptap
- FadedNotesView - Soft-deleted notes recovery
- ChangelogPage - Version history display
- RoadmapPage - Feature roadmap with status badges

**Shared Components (26):**
- Auth - Login/signup/OAuth/password reset
- ChapterNav - Desktop dot navigation sidebar
- ChapterSection - Collapsible chapter with masonry grid
- ConflictModal - "Two Paths" sync conflict resolution
- EditorToolbar - Rich text formatting toolbar
- ErrorBoundary - Graceful error handling
- FadedNoteCard - Card for soft-deleted notes
- Footer - Minimal navigation links
- Header - Library header with search
- HeaderShell - Consistent header structure
- LettingGoModal - Account offboarding
- NoteCard - Individual note display
- RichTextEditor - Tiptap wrapper component
- SettingsModal - Profile and theme settings
- ShareModal - Share link management
- SharedNoteView - Public read-only note view
- SlashCommand - Editor slash command menu
- SyncIndicator - Offline/sync status indicator
- TagBadge - Small tag display
- TagFilterBar - Tag filtering strip
- TagModal - Tag create/edit dialog
- TagPill - Tag pill with edit button
- TagSelector - Tag assignment dropdown
- TimeRibbon - Mobile chapter navigation
- WelcomeBackPrompt - Grace period return prompt
- WhisperBack - Floating back button

### Database Schema

**Tables:**

notes
- id (uuid, PK)
- user_id (FK to auth.users)
- title (text)
- content (text, HTML from Tiptap)
- pinned (boolean)
- deleted_at (timestamptz, nullable - for soft delete)
- created_at (timestamptz)
- updated_at (timestamptz)

tags
- id (uuid, PK)
- user_id (FK to auth.users)
- name (text)
- color (text)
- created_at (timestamptz)

note_tags (junction table)
- note_id (FK, PK)
- tag_id (FK, PK)

note_shares
- id (uuid, PK)
- note_id (FK, unique)
- user_id (FK)
- share_token (varchar(32), unique)
- expires_at (timestamptz, nullable)
- created_at (timestamptz)

**IndexedDB (Offline Storage):**

LocalNote - Mirrors notes table with sync metadata
LocalTag - Mirrors tags table with sync metadata
LocalNoteTag - Junction table for offline note-tag relationships
SyncQueueItem - Pending operations to sync when online

### Features Implemented (v1.9.11)

**Core Functionality:**
- Wabi-sabi design with light/dark themes (dark default)
- Rich text editor (bold, italic, underline, headers, lists, quotes, code, task lists)
- Tag-based organization with color picker (8 colors)
- Real-time sync across tabs/devices
- Search with Cmd/Ctrl+K shortcut
- Pin notes to top of library
- Slash commands (/h1, /h2, /h3, /bullet, /todo, /date, /time, etc.)

**Authentication:**
- Email/password authentication
- Google OAuth
- GitHub OAuth
- Password reset flow
- Account offboarding with 14-day grace period

**Organization:**
- Temporal chapters (Pinned, This Week, Last Week, This Month, Earlier, Archive)
- Soft-delete with 30-day recovery (Faded Notes)
- Collapsible chapter sections

**Export/Import:**
- JSON backup (full notes + tags)
- Markdown export (single or bulk)
- Clipboard copy (plain text or formatted)
- Batch import with progress indicator

**Sharing:**
- Share as Letter (temporary read-only links)
- Configurable expiration (1/7/30 days or never)
- Beautiful shared note view

**Progressive Web App:**
- Installable on desktop/mobile
- Offline app shell
- Font caching

**Offline Editing (Infrastructure Ready):**
- IndexedDB schema with Dexie.js
- Sync queue with conflict detection
- "Two Paths" conflict modal for resolution
- SyncIndicator component for status display
- *Note: Integration with App.tsx pending*

### Test Coverage

| Category | Files | Tests |
|----------|-------|-------|
| Component Tests | 8 | Auth, Editor, HeaderShell, ChapteredLibrary, ShareModal, TagModal, TagBadge, ErrorBoundary |
| Utility Tests | 5 | formatTime, sanitize, temporalGrouping, exportImport, withRetry |
| Service Tests | 3 | notes, tags, syncEngine |
| Hook Tests | 1 | useNetworkStatus |
| E2E Tests | 6 | auth, notes, tags, sharing, export-import, settings |

### Notable Changes Since Last Snapshot

**v1.9.11 (2025-12-29):** Accessibility & styling
- Dark mode delete button now uses proper red color instead of coral
- Delete confirmation dialog accessibility improvements

**Documentation (2026-01-07):**
- Added competitive growth plan for user acquisition
- Updated documentation for offline editing feature
- Added documentation index and strategic viability review

**Offline Editing Infrastructure (2025-12):**
- Added Dexie.js for IndexedDB storage
- Created offlineDb.ts with schema definitions
- Implemented offlineNotes.ts, offlineTags.ts, syncEngine.ts services
- Added useSyncEngine.ts and useSyncStatus.ts hooks
- Created ConflictModal and SyncIndicator components
- *Status: TypeScript errors need resolution before production use*

---

## Snapshot: 2025-12-28 at 19:00 UTC

**Author:** Claude (Opus 4.5)
**Captured:** 2025-12-28T19:00:00Z
**Commit:** ad6905b (main branch)

### Architecture Overview

The Zenote application follows a layered architecture pattern:

**ZENOTE ARCHITECTURE (React SPA with Supabase Backend)**

PRESENTATION LAYER
- Core Views: LandingPage (Split-view), ChapteredLibrary (Temporal Grid), Editor (Rich Text)
- HeaderShell provides consistent header across all views
- UI Components: NoteCard, TagPill, TagBadge, WhisperBack
- Navigation: ChapterNav (Desktop), TimeRibbon (Mobile), TagFilterBar, EditorToolbar

MODAL COMPONENTS
- SettingsModal (Profile), TagModal (Create/Edit), ShareModal (Share Links), LettingGoModal (Offboarding)

STATE MANAGEMENT
- App.tsx: Notes, Tags, UI State, Real-time Subscriptions
- AuthContext: User session, OAuth, Password reset, Offboarding

SERVICE LAYER
- notes.ts: CRUD operations, Soft delete (Faded Notes), Share links, Batch operations
- tags.ts: CRUD operations, Color management

UTILITY LAYER
- sanitize (XSS), exportImport (Backup), formatTime (Relative), temporalGrouping, withRetry (Network), lazyWithRetry (Smart Chunk Loading)

EXTERNAL SERVICES
- Supabase: PostgreSQL (Database), Auth (OAuth+PW), Real-time (Sync), RLS (Security)
- Vercel: Hosting + CDN
- Sentry: Error Monitoring

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend Framework** | React | 19.2.0 |
| **Language** | TypeScript | 5.9.3 |
| **Build Tool** | Vite | 7.2.4 |
| **Styling** | Tailwind CSS | 4.1.17 |
| **Rich Text Editor** | Tiptap (ProseMirror) | 3.13.0 |
| **Layout** | react-masonry-css | 1.0.16 |
| **Backend/Database** | Supabase | 2.86.2 |
| **Error Monitoring** | Sentry | 10.30.0 |
| **Notifications** | react-hot-toast | 2.6.0 |
| **XSS Prevention** | DOMPurify | 3.3.1 |
| **Unit Testing** | Vitest | 4.0.15 |
| **E2E Testing** | Playwright | 1.57.0 |
| **Linting** | ESLint | 9.39.1 |

### Production Deployment

- **Platform:** Vercel (auto-deploys from main branch)
- **Live URL:** https://zenote.vercel.app
- **Repository:** https://github.com/anbuneel/zenote
- **CI/CD:** GitHub Actions (typecheck, lint, test, build)
- **PWA:** Yes (installable, offline app shell, font caching)
- **CDN:** Vercel Edge Network

### Code Metrics

| Metric | Count |
|--------|-------|
| **Total Lines of Code** | 20,178 |
| TypeScript/TSX (src/) | 17,973 |
| CSS (src/) | 724 |
| E2E Tests (e2e/) | 1,054 |
| SQL Migrations | 288 |
| Build Scripts | 139 |
| **Source Files** | |
| React Components | 34 |
| Component Tests | 8 |
| Utility/Service Tests | 8 |
| E2E Spec Files | 6 |
| Theme Configs | 4 |
| **Bundle Size (Optimized)** | |
| Initial JS Bundle | 333 KB |
| Editor Chunk (lazy) | 407 KB |
| Vendor Supabase (lazy) | 185 KB |
| Vendor Sentry (lazy) | 18 KB |
| Vendor React (lazy) | 4 KB |
| Total JS | 994 KB |
| Total CSS | 45 KB |

### Component Inventory

**Core Views (6):**
- LandingPage - Split-screen hero with interactive demo
- ChapteredLibrary - Temporal note organization (Pinned, This Week, etc.)
- Editor - Rich text editing with Tiptap
- FadedNotesView - Soft-deleted notes recovery
- ChangelogPage - Version history display
- RoadmapPage - Feature roadmap with status badges

**Shared Components (28):**
- Auth - Login/signup/OAuth/password reset
- ChapterNav - Desktop dot navigation sidebar
- ChapterSection - Collapsible chapter with masonry grid
- EditorToolbar - Rich text formatting toolbar
- ErrorBoundary - Graceful error handling
- FadedNoteCard - Card for soft-deleted notes
- Footer - Minimal navigation links
- Header - Library header with search
- HeaderShell - Consistent header structure
- LettingGoModal - Account offboarding
- NoteCard - Individual note display
- RichTextEditor - Tiptap wrapper component
- SettingsModal - Profile and theme settings
- ShareModal - Share link management
- SharedNoteView - Public read-only note view
- SlashCommand - Editor slash command menu
- TagBadge - Small tag display
- TagFilterBar - Tag filtering strip
- TagModal - Tag create/edit dialog
- TagPill - Tag pill with edit button
- TagSelector - Tag assignment dropdown
- TimeRibbon - Mobile chapter navigation
- WelcomeBackPrompt - Grace period return prompt
- WhisperBack - Floating back button

### Database Schema

**Tables:**

notes
- id (uuid, PK)
- user_id (FK to auth.users)
- title (text)
- content (text, HTML from Tiptap)
- pinned (boolean)
- deleted_at (timestamptz, nullable - for soft delete)
- created_at (timestamptz)
- updated_at (timestamptz)

tags
- id (uuid, PK)
- user_id (FK to auth.users)
- name (text)
- color (text)
- created_at (timestamptz)

note_tags (junction table)
- note_id (FK, PK)
- tag_id (FK, PK)

note_shares
- id (uuid, PK)
- note_id (FK, unique)
- user_id (FK)
- share_token (varchar(32), unique)
- expires_at (timestamptz, nullable)
- created_at (timestamptz)

### Features Implemented (v1.9.10)

**Core Functionality:**
- Wabi-sabi design with light/dark themes (dark default)
- Rich text editor (bold, italic, underline, headers, lists, quotes, code, task lists)
- Tag-based organization with color picker (8 colors)
- Real-time sync across tabs/devices
- Search with Cmd/Ctrl+K shortcut
- Pin notes to top of library
- Slash commands (/h1, /h2, /h3, /bullet, /todo, /date, /time, etc.)

**Authentication:**
- Email/password authentication
- Google OAuth
- GitHub OAuth
- Password reset flow
- Account offboarding with 14-day grace period

**Organization:**
- Temporal chapters (Pinned, This Week, Last Week, This Month, Earlier, Archive)
- Soft-delete with 30-day recovery (Faded Notes)
- Collapsible chapter sections

**Export/Import:**
- JSON backup (full notes + tags)
- Markdown export (single or bulk)
- Clipboard copy (plain text or formatted)
- Batch import with progress indicator

**Sharing:**
- Share as Letter (temporary read-only links)
- Configurable expiration (1/7/30 days or never)
- Beautiful shared note view

**Progressive Web App:**
- Installable on desktop/mobile
- Offline app shell
- Font caching

### Test Coverage

| Category | Files | Tests |
|----------|-------|-------|
| Component Tests | 8 | Auth, Editor, HeaderShell, ChapteredLibrary, ShareModal, TagModal, TagBadge, ErrorBoundary |
| Utility Tests | 5 | formatTime, sanitize, temporalGrouping, exportImport, withRetry |
| Service Tests | 2 | notes, tags |
| Hook Tests | 1 | useNetworkStatus |
| E2E Tests | 6 | auth, notes, tags, sharing, export-import, settings |

### Notable Changes Since Last Snapshot

**v1.9.10 (2025-12-29):** Smart chunk loading
- Added `lazyWithRetry` utility for graceful version update handling
- Auto-retries chunk loads and quietly reloads when safe (no unsaved work)
- Added data-save-status attribute to Editor for detecting in-flight saves

**v1.9.9 (2025-12-29):** Shared notes RLS fix
- Fixed shared notes not viewable by unauthenticated users
- Added RLS policies for public access to notes/tags with valid share tokens
- Updated E2E tests for correct share URL format (/?s=token)

**v1.9.8 (2025-12-29):** Code cleanup - removed 230 lines of dead code
- Deleted legacy `Library.tsx` component (replaced by ChapteredLibrary)
- Removed unused `getNoteTags()` function from tags service
- Removed unused theme utilities and type exports
- Updated component count: 35 → 34

---

*End of snapshot timeline*
