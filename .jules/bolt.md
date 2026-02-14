## 2026-02-14 - Memoizing Expensive Sanitization
**Learning:** `DOMPurify.sanitize` and HTML parsing operations are synchronous and computationally expensive. In list components like `NoteCard`, executing these on every render (even when content hasn't changed) causes noticeable main-thread blocking, especially during high-frequency updates or scrolling.
**Action:** Always wrap `sanitizeHtml` and content parsing logic in `useMemo` within list items, keying off the raw content strings.
