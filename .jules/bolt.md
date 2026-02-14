## 2024-05-22 - IntersectionObserver Consolidation
**Learning:** Creating a new `IntersectionObserver` for every element in a list is a performance anti-pattern that consumes excessive memory and CPU.
**Action:** Use a single `IntersectionObserver` instance to observe multiple elements, and identify the specific element via `entry.target` (e.g., using `data-attributes` or IDs).
