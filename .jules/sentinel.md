# Sentinel Journal - Critical Security Learnings

## 2025-02-18 - Reverse Tabnabbing Vulnerability
**Vulnerability:** External links (`target="_blank"`) without `rel="noopener noreferrer"` can allow the opened page to manipulate the original page via `window.opener`.
**Learning:** `DOMPurify` does not automatically add `rel="noopener noreferrer"` to `target="_blank"` links unless explicitly hooked.
**Prevention:** Added a global `DOMPurify` hook in `src/utils/sanitize.ts` to enforce `rel="noopener noreferrer"` on all `target="_blank"` links.
