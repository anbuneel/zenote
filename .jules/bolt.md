## 2026-01-29 - List Component Memoization
**Learning:** List components (like NoteCard) in this codebase require `React.memo` with a custom comparator because the parent component (`App.tsx`) creates new handler functions on every render. Standard reference equality checks on props would fail to prevent re-renders.
**Action:** When optimizing list components, check if handlers are stable. If not, use a custom comparator for `React.memo` that explicitly checks data props (e.g., `prev.note === next.note`) and ignores handler props, relying on the fact that data updates are immutable.
