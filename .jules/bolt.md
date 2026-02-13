## 2024-05-23 - Client-side HTML Sanitization
**Learning:** `DOMPurify.sanitize` is a synchronous, CPU-intensive operation. Running it inside a `NoteCard`'s render loop (even if memoized) causes significant jank when re-rendering lists (e.g., pinning/unpinning) because changing metadata changes the object reference, bypassing simple `memo` comparison.
**Action:** Always memoize sanitized content based on the raw content string (`useMemo(() => sanitize(content), [content])`) to avoid re-parsing when only metadata changes.
