## 2026-02-04 - Reverse Tabnabbing Protection
**Vulnerability:** Links with `target="_blank"` were vulnerable to reverse tabnabbing (phishing via `window.opener`).
**Learning:** `DOMPurify` configuration alone (`ALLOWED_ATTR`) is insufficient to enforce attributes; hooks are required.
**Prevention:** Use `DOMPurify.addHook('afterSanitizeAttributes', ...)` to enforce `rel="noopener noreferrer"`.
