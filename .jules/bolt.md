# Bolt's Performance Journal

## 2026-02-11 - IntersectionObserver Instantiation
**Learning:** `ChapteredLibrary` was creating a new `IntersectionObserver` instance for each chapter inside a loop, causing unnecessary resource overhead.
**Action:** Use a single `IntersectionObserver` instance to observe multiple targets. Extract necessary context (like chapter ID) directly from the target element (e.g., `entry.target.id`) within the callback.
