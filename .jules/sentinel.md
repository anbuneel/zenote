## 2026-02-01 - Reverse Tabnabbing in Sanitized HTML
**Vulnerability:** User-generated content with `target="_blank"` links did not enforce `rel="noopener noreferrer"`, allowing opened pages to control the parent window (Reverse Tabnabbing).
**Learning:** `DOMPurify` does not automatically add `rel="noopener noreferrer"` to `target="_blank"` links by default; it requires an explicit hook. `sanitizeHtml` was allowing `target` but missing the corresponding safety attribute.
**Prevention:** Always register a `DOMPurify` hook to enforce `rel="noopener noreferrer"` whenever `target="_blank"` is allowed in user content.
