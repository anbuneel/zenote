## 2025-10-25 - [Virtualization vs Memoization]
**Learning:** In a long list of components grouped by sections (like `ChapteredLibrary`), if the parent component manages scroll state (e.g., active chapter detection), it triggers re-renders of the entire list. Without virtualization, `React.memo` on section components is CRITICAL to prevent massive layout thrashing during scroll.
**Action:** Always wrap heavy list items or sections in `React.memo` if the parent has frequent state updates (like scroll listeners).
