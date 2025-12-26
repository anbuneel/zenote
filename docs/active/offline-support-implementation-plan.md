# Offline Support Implementation Plan

**Author:** Claude (Opus 4.5)
**Date:** 2025-12-25
**Status:** Proposed
**Design Reference:** `docs/analysis/offline-support-design-claude.md`

---

## Overview

Implement local-first offline support for Zenote that aligns with the Zen/wabi-sabi design philosophy. Users should feel like they're writing in a personal notebook that occasionally syncs, not using cloud software that caches.

---

## Implementation Phases

### Phase 1: Local-First Foundation (4-5 days)

Full offline capability with silent sync. No "degraded mode" — offline is the natural state.

### Phase 2: Kintsugi Conflicts (2-3 days, optional)

Beautiful conflict resolution UI. Deferrable since conflicts are rare for single-device users.

---

## Phase 1: Detailed Implementation

### Step 1: Dependencies & PWA Setup (4-6 hours)

**Install dependencies:**
```bash
npm install vite-plugin-pwa dexie workbox-window
```

**Files to create/modify:**

| File | Action | Purpose |
|------|--------|---------|
| `vite.config.ts` | Modify | Add PWA plugin configuration |
| `public/manifest.json` | Create | PWA manifest with app metadata |
| `public/icons/` | Create | App icons (192x192, 512x512) |
| `src/sw.ts` | Create | Service worker registration |

**vite.config.ts changes:**
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'CacheFirst',
          },
        ],
      },
      manifest: {
        name: 'Zenote',
        short_name: 'Zenote',
        description: 'A quiet space for your mind',
        theme_color: '#1a1f1a',
        background_color: '#1a1f1a',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```

---

### Step 2: IndexedDB Local Storage (6-8 hours)

**Files to create:**

| File | Purpose |
|------|---------|
| `src/lib/db.ts` | Dexie database schema definition |
| `src/services/localNotes.ts` | Local CRUD operations |
| `src/services/localTags.ts` | Local tag operations |
| `src/hooks/useLocalStorage.ts` | React hook for local data |

**Database schema (`src/lib/db.ts`):**
```typescript
import Dexie, { Table } from 'dexie';

export interface LocalNote {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'conflict';
  lastSyncedAt: string | null;
  serverVersion: number;
}

export interface LocalTag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  syncStatus: 'synced' | 'pending';
}

export interface LocalNoteTag {
  noteId: string;
  tagId: string;
  syncStatus: 'synced' | 'pending';
}

export interface SyncQueueItem {
  id: string;
  type: 'note' | 'tag' | 'noteTag';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  payload: unknown;
  createdAt: string;
  retryCount: number;
}

class ZenoteDB extends Dexie {
  notes!: Table<LocalNote>;
  tags!: Table<LocalTag>;
  noteTags!: Table<LocalNoteTag>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('zenote');
    this.version(1).stores({
      notes: 'id, syncStatus, updatedAt, deletedAt',
      tags: 'id, syncStatus, name',
      noteTags: '[noteId+tagId], noteId, tagId, syncStatus',
      syncQueue: 'id, type, operation, createdAt',
    });
  }
}

export const db = new ZenoteDB();
```

---

### Step 3: Sync Engine (8-12 hours)

**Files to create:**

| File | Purpose |
|------|---------|
| `src/services/sync.ts` | Core sync logic |
| `src/hooks/useSyncStatus.ts` | React hook for sync state |
| `src/contexts/SyncContext.tsx` | Sync state provider |

**Sync strategy:**

```
┌─────────────────────────────────────────────────────────────┐
│                      SYNC FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User makes change                                       │
│     ↓                                                       │
│  2. Write to IndexedDB immediately (optimistic)             │
│     ↓                                                       │
│  3. Add to sync queue with status: 'pending'                │
│     ↓                                                       │
│  4. If online → attempt sync to Supabase                    │
│     ├─ Success → mark as 'synced', remove from queue        │
│     └─ Failure → keep in queue, retry on reconnect          │
│     ↓                                                       │
│  5. If offline → stays in queue until reconnect             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Core sync service (`src/services/sync.ts`):**
```typescript
export class SyncService {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;

  // Initialize and set up listeners
  init(): void;

  // Process pending queue items
  async processQueue(): Promise<void>;

  // Sync a single note to server
  async syncNote(note: LocalNote): Promise<SyncResult>;

  // Pull latest from server (on reconnect)
  async pullFromServer(): Promise<void>;

  // Handle conflicts (Phase 1: last-write-wins)
  resolveConflict(local: LocalNote, server: DbNote): LocalNote;

  // Subscribe to online/offline events
  private setupNetworkListeners(): void;
}
```

**Conflict resolution (Phase 1 - Last Write Wins):**
```typescript
resolveConflict(local: LocalNote, server: DbNote): LocalNote {
  const localTime = new Date(local.updatedAt).getTime();
  const serverTime = new Date(server.updated_at).getTime();

  // Last write wins - simple but effective for single-device use
  return localTime > serverTime ? local : toLocalNote(server);
}
```

---

### Step 4: UI Indicators (4-6 hours)

**Files to modify:**

| File | Change |
|------|--------|
| `src/components/Header.tsx` | Add "quiet sky" offline indicator |
| `src/components/NoteCard.tsx` | Add "ink drying" pending dot |
| `src/hooks/useNetworkStatus.ts` | Enhance with sync awareness |

**"Quiet Sky" Offline Indicator:**
```tsx
// In Header.tsx
{!isOnline && (
  <span
    className="offline-indicator"
    title="Writing locally. Will sync when the path clears."
    style={{
      opacity: 0.3,
      fontSize: '0.875rem',
      color: 'var(--color-text-tertiary)',
      transition: 'opacity 2s ease-out',
    }}
  >
    雲
  </span>
)}
```

**"Ink Drying" Pending Indicator:**
```tsx
// In NoteCard.tsx
{note.syncStatus === 'pending' && (
  <span
    className="pending-dot"
    style={{
      opacity: 0.6,
      color: 'var(--color-text-tertiary)',
      marginLeft: '4px',
      animation: 'fade-out 0.3s ease-out forwards',
    }}
  >
    ·
  </span>
)}
```

**Breath-rhythm animation (`src/index.css`):**
```css
@keyframes breath-pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.5; }
}

.syncing-indicator {
  animation: breath-pulse 1.1s ease-in-out infinite;
}
```

---

### Step 5: Integration & Migration (4-6 hours)

**Files to modify:**

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap with SyncProvider, use local data |
| `src/services/notes.ts` | Add local-first wrapper functions |
| `src/contexts/AuthContext.tsx` | Trigger initial sync on login |

**Data flow change:**

```
BEFORE (Cloud-First):
  App → Supabase → UI

AFTER (Local-First):
  App → IndexedDB → UI
           ↓
       SyncService → Supabase (background)
```

**Migration strategy for existing users:**
1. On first load with new version, pull all notes from Supabase
2. Store in IndexedDB
3. Mark all as 'synced'
4. Future operations go through local-first flow

---

## Phase 2: Kintsugi Conflicts (Optional)

### Step 6: Conflict Detection (2-3 hours)

Enhance `resolveConflict()` to detect when both local and server changed:

```typescript
resolveConflict(local: LocalNote, server: DbNote): ConflictResult {
  const localChanged = local.updatedAt > local.lastSyncedAt;
  const serverChanged = server.updated_at > local.lastSyncedAt;

  if (localChanged && serverChanged) {
    return { type: 'conflict', local, server };
  }
  // ... last-write-wins for non-conflicts
}
```

### Step 7: "Two Paths" Resolution UI (4-6 hours)

**Files to create:**

| File | Purpose |
|------|---------|
| `src/components/ConflictModal.tsx` | Two-column comparison view |
| `src/components/KintsugiEffect.tsx` | Gold shimmer animation |

**ConflictModal design:**
- Serif heading: "Two versions of this thought exist."
- Side-by-side cards with equal visual weight
- Three options: Keep local, Keep server, Keep both
- Gold shimmer on resolution

---

## Testing Checklist

### Offline Scenarios
- [ ] Create note while offline → syncs on reconnect
- [ ] Edit note while offline → syncs on reconnect
- [ ] Delete note while offline → syncs on reconnect
- [ ] Multiple edits while offline → all sync correctly
- [ ] Close app while offline, reopen → data persisted

### Sync Scenarios
- [ ] Slow connection → UI remains responsive
- [ ] Sync failure → retries automatically
- [ ] Large note collection → initial sync handles gracefully
- [ ] Real-time updates from other devices → merge correctly

### UI Scenarios
- [ ] Offline indicator appears/disappears correctly
- [ ] Pending dot shows on unsaved notes
- [ ] No jarring transitions or flashes
- [ ] Animations follow breath rhythm

---

## Estimated Timeline

| Step | Task | Time |
|------|------|------|
| 1 | Dependencies & PWA Setup | 4-6 hrs |
| 2 | IndexedDB Local Storage | 6-8 hrs |
| 3 | Sync Engine | 8-12 hrs |
| 4 | UI Indicators | 4-6 hrs |
| 5 | Integration & Migration | 4-6 hrs |
| | **Phase 1 Total** | **26-38 hrs (~4-5 days)** |
| 6 | Conflict Detection | 2-3 hrs |
| 7 | Two Paths UI | 4-6 hrs |
| | **Phase 2 Total** | **6-9 hrs (~1-2 days)** |

---

## Dependencies

```json
{
  "vite-plugin-pwa": "^0.17.0",
  "dexie": "^4.0.0",
  "workbox-window": "^7.0.0"
}
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| IndexedDB quota limits | Notes lost if quota exceeded | Monitor usage, warn user |
| Sync race conditions | Data corruption | Use versioning, queue serialization |
| PWA caching issues | Stale app version | Implement update prompt |
| Complex merge conflicts | User frustration | Phase 1 uses simple last-write-wins |

---

## Success Criteria

1. **Invisible when working:** User shouldn't notice sync happening
2. **Reliable offline:** All CRUD operations work without connection
3. **No data loss:** Queue persists through app restarts
4. **Zen aesthetic:** Indicators follow design philosophy (quiet, breath-rhythm)
5. **Performance:** No perceptible delay from local-first approach

---

## Related Documents

- Design Philosophy: `docs/analysis/offline-support-design-claude.md`
- Network Status Hook: `src/hooks/useNetworkStatus.ts`
- Current Notes Service: `src/services/notes.ts`
