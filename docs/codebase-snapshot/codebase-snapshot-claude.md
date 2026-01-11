# Codebase Snapshot Timeline

This document tracks the evolution of the Zenote codebase over time.

---

## Snapshot: 2026-01-10 at 18:00 UTC

**Author:** Claude (Opus 4.5)
**Captured:** 2026-01-10T18:00:00Z
**Commit:** f1f303d (main branch)
**Release:** v2.3.1 - PWA Native Feel + Codex Review Fixes

### Architecture Overview

The Zenote application follows a layered architecture pattern with new mobile-native interaction components:

ZENOTE ARCHITECTURE (React SPA with Supabase Backend)

PRESENTATION LAYER
- Core Views: LandingPage, ChapteredLibrary (with PullToRefresh), Editor, DemoPage, FadedNotesView, ChangelogPage, RoadmapPage
- Mobile-Native Components (NEW v2.3): SwipeableNoteCard, PullToRefresh, IOSInstallGuide
- HeaderShell provides consistent header across all views
- UI Components: NoteCard, TagPill, TagBadge, WhisperBack, SyncIndicator
- Navigation: ChapterNav (Desktop), TimeRibbon (Mobile), TagFilterBar

MODAL COMPONENTS
- SettingsModal, TagModal, ShareModal, LettingGoModal
- ConflictModal (Two Paths sync conflict resolution)
- InstallPrompt, InvitationModal (demo signup prompt)

STATE MANAGEMENT
- App.tsx: Notes, Tags, UI State, Real-time Subscriptions
- AuthContext: User session, OAuth, Password reset, Offboarding
- useDemoState: Demo mode localStorage state management

SERVICE LAYER
- notes.ts, tags.ts, demoStorage.ts, demoMigration.ts
- offlineNotes.ts, offlineTags.ts, syncEngine.ts

HOOKS LAYER (9 total, 5 NEW)
- useNetworkStatus, useSyncEngine, useSyncStatus, useViewTransition
- useInstallPrompt [NEW], useShareTarget [NEW], useDemoState [NEW]
- useSoftPrompt [NEW], useMobileDetect [NEW]

UTILITY LAYER
- sanitize, exportImport, formatTime, temporalGrouping, withRetry, lazyWithRetry

EXTERNAL SERVICES
- Supabase (PostgreSQL, Auth, Real-time, RLS)
- Vercel (Hosting, CDN)
- Sentry (Error monitoring)
- Capacitor (Native Android wrapper)

### Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| **Frontend Framework** | React | 19.2.0 |
| **Language** | TypeScript | 5.9.3 |
| **Build Tool** | Vite | 7.2.6 |
| **Styling** | Tailwind CSS | 4.1.17 |
| **Rich Text Editor** | Tiptap (ProseMirror) | 3.13.0 |
| **Layout** | react-masonry-css | 1.0.16 |
| **Backend/Database** | Supabase | 2.86.2 |
| **Offline Storage** | Dexie (IndexedDB) | 4.2.1 |
| **Gesture Library** | @use-gesture/react | 10.3.1 |
| **Animation** | @react-spring/web | 10.0.3 |
| **Native Wrapper** | Capacitor | 8.0.0 |
| **Error Monitoring** | Sentry | 10.30.0 |
| **Notifications** | react-hot-toast | 2.6.0 |
| **XSS Prevention** | DOMPurify | 3.3.1 |
| **Unit Testing** | Vitest | 4.0.15 |
| **E2E Testing** | Playwright | 1.57.0 |
| **Linting** | ESLint | 9.39.1 |

**New Dependencies in v2.3:**
- @use-gesture/react - Touch gesture handling (swipe, drag)
- @react-spring/web - Physics-based spring animations

### Production Deployment

- **Platform:** Vercel (auto-deploys from main branch)
- **Live URL:** https://zenote.vercel.app
- **Repository:** https://github.com/anbuneel/zenote
- **CI/CD:** GitHub Actions (typecheck, lint, test, build)
- **PWA:** Yes (installable, offline app shell, Share Target, Apple splash screens)
- **Native:** Android APK via Capacitor (iOS planned)

### Code Metrics

| Metric | Count | Change |
|--------|-------|--------|
| **Total Lines of Code** | 28,872 | +2,537 |
| TypeScript/TSX (src/) | 26,074 | +2,690 |
| CSS (src/) | 958 | +67 |
| E2E Tests (e2e/) | 1,473 | - |
| SQL Migrations | 370 | - |
| Build Scripts | 375 | +158 |
| **Source Files** | | |
| React Components | 42 | +10 |
| Component Tests | 9 | +1 |
| Hook Tests | 3 | +2 |
| E2E Spec Files | 6 | - |
| **Bundle Size** | | |
| Initial JS | 557 KB | +224 KB |
| Editor Chunk | 417 KB | +10 KB |
| DemoPage Chunk | 14 KB | NEW |
| Total JS | ~1,261 KB | +267 KB |
| Total CSS | 53 KB | +8 KB |

### Component Inventory

**Core Views (7):**
- LandingPage, ChapteredLibrary, DemoPage [NEW], Editor
- FadedNotesView, ChangelogPage, RoadmapPage

**Mobile-Native Components (3) [NEW in v2.3]:**
- SwipeableNoteCard - iOS-style swipe gestures (left=delete, right=pin)
- PullToRefresh - Pull-down refresh with spring physics
- IOSInstallGuide - Visual PWA install tutorial for Safari

**Demo Components (2) [NEW in v2.2]:**
- ImpermanenceRibbon, InvitationModal

**Shared Components (30):**
Auth, ChapterNav, ChapterSection, ConflictModal, EditorToolbar,
ErrorBoundary, FadedNoteCard, Footer, Header, HeaderShell,
InstallPrompt [NEW], LettingGoModal, LoadingFallback [NEW], NoteCard,
RichTextEditor, SettingsModal, ShareModal, SharedNoteView, SlashCommand,
SyncIndicator, TagBadge, TagFilterBar, TagModal, TagPill, TagSelector,
TimeRibbon, WelcomeBackPrompt, WhisperBack

### Hooks Inventory (9 total, 5 NEW)

| Hook | Purpose |
|------|---------|
| useNetworkStatus | Network monitoring (Capacitor + browser) |
| useSyncEngine | Sync engine React integration |
| useSyncStatus | Sync state for UI |
| useViewTransition | View Transitions API wrapper |
| useInstallPrompt | PWA install with engagement tracking [NEW] |
| useShareTarget | Share Target API handler [NEW] |
| useDemoState | Demo mode state management [NEW] |
| useSoftPrompt | Soft signup prompt triggers [NEW] |
| useMobileDetect | Touch/mobile device detection [NEW] |

### Features Implemented (v2.3.1)

**Core:** Wabi-sabi design, rich text editor, tags, real-time sync, search, pin, slash commands
**Auth:** Email/password, Google/GitHub OAuth, password reset, account offboarding
**Organization:** Temporal chapters, soft-delete (Faded Notes), collapsible sections
**Export/Import:** JSON backup, Markdown export, clipboard copy, batch import
**Sharing:** Share as Letter, configurable expiration

**PWA (Enhanced in v2.3):**
- Installable, offline app shell, Share Target API
- iOS Safari install guide [NEW]
- Apple splash screens [NEW]

**Mobile Native Feel (v2.3):**
- Swipe left to delete, right to pin/unpin
- Pull-to-refresh to sync
- iOS-style spring animations
- Card entrance animation with stagger
- Haptic feedback at thresholds

**Practice Space (v2.2):**
- Full demo at /demo without signup
- localStorage persistence
- Soft signup prompts, auto-migration

**Offline Editing (v2.0):**
- IndexedDB with Dexie.js
- Sync queue, conflict detection
- Two Paths conflict modal

### Test Coverage

| Category | Files | Tests |
|----------|-------|-------|
| Component Tests | 9 | Auth, Editor, HeaderShell, ChapteredLibrary, ShareModal, TagModal, TagBadge, ErrorBoundary, InstallPrompt |
| Utility Tests | 5 | formatTime, sanitize, temporalGrouping, exportImport, withRetry |
| Service Tests | 3 | notes, tags, syncEngine |
| Hook Tests | 3 | useNetworkStatus, useInstallPrompt, useShareTarget |
| E2E Tests | 6 | auth, notes, tags, sharing, export-import, settings |

### Notable Changes Since Last Snapshot (2026-01-07)

**v2.3.1 (2026-01-11):** Codex Review Bug Fixes
- Pull-to-refresh correctly detects scroll position with nested containers
- Swipe-to-delete gracefully recovers UI if delete fails (shake animation)
- iOS install guide animation completes smoothly on dismiss
- Improved compatibility with older iOS Safari versions (iOS < 14)
- Swipe gesture timing reduced from 200ms to 150ms for snappier feel

**v2.3.0 (2026-01-10):** PWA Native Feel
- iOS Safari install guide with visual tutorial
- Apple splash screens for all iOS devices
- Swipe gestures on mobile (left=delete, right=pin/unpin)
- Pull-to-refresh on note list
- iOS-style spring animations
- Card entrance animation with stagger effect
- New dependencies: @use-gesture/react, @react-spring/web

**v2.2.0 (2026-01-09):** Practice Space
- Full demo at /demo without signup
- localStorage persistence
- Soft signup prompts after 3+ notes and 5+ minutes
- Auto-migration of demo notes on account creation
- New: DemoPage, ImpermanenceRibbon, InvitationModal, useDemoState, useSoftPrompt

**v2.1.x (2026-01-08-09):** Share Target, Install Prompt, Android Fix
- Share Target API integration
- Engagement-triggered PWA install prompt
- Defense-in-depth timeout for Android WebView

**v2.0.0 (2026-01-07):** Offline Editing
- IndexedDB persistence, conflict resolution

**Code Growth Summary:**
- +4,520 lines of TypeScript
- +10 new components, +5 new hooks
- +2 new dependencies
- +36 commits

---

## Snapshot: 2026-01-07 at 12:00 UTC

**Author:** Claude (Opus 4.5)
**Captured:** 2026-01-07T12:00:00Z
**Commit:** 0c34982 (main branch)

### Code Metrics

| Metric | Count |
|--------|-------|
| Total Lines of Code | 26,335 |
| TypeScript/TSX (src/) | 23,384 |
| CSS (src/) | 891 |
| React Components | 32 |
| Initial JS Bundle | 333 KB |
| Total JS | 994 KB |

### Notable Changes

**v1.9.11:** Accessibility improvements
**Offline Infrastructure:** Dexie.js, offlineNotes.ts, syncEngine.ts, ConflictModal

---

## Snapshot: 2025-12-28 at 19:00 UTC

**Author:** Claude (Opus 4.5)
**Captured:** 2025-12-28T19:00:00Z
**Commit:** ad6905b (main branch)

### Code Metrics

| Metric | Count |
|--------|-------|
| Total Lines of Code | 20,178 |
| TypeScript/TSX (src/) | 17,973 |
| React Components | 34 |
| Total JS | 994 KB |

### Notable Changes

**v1.9.10:** Smart chunk loading
**v1.9.9:** Shared notes RLS fix
**v1.9.8:** Code cleanup (removed 230 lines)

---

*End of snapshot timeline*
