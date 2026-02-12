## 2024-05-23 - Memory vs Code Reality
**Learning:** Memory claimed `ChapteredLibrary` was optimized with a single `IntersectionObserver`, but the actual code used one observer per chapter (O(N) vs O(1)).
**Action:** Always verify "known" optimizations in the actual code before assuming they exist. Trust code over memory context.
