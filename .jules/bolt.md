## 2024-05-23 - [ChapterSection Memoization]
**Learning:** `App.tsx` recreates handlers (`onNoteClick`, etc.) and data structures (`chapters` via `groupNotesByChapter`) on every render. This causes `ChapterSection` to re-render constantly even if note content is unchanged, triggering expensive `Masonry` layouts.
**Action:** Use `React.memo` with a custom comparison function in `ChapterSection` to check for shallow note equality and ignore unstable handler props. This avoids re-renders when `App` updates unrelated state (like search query typing).
