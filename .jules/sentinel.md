# Sentinel Journal

## 2025-05-20 - Reverse Tabnabbing via Rich Text
**Vulnerability:** User-generated content with `target="_blank"` links (e.g., from pasted HTML) lacked `rel="noopener noreferrer"`, exposing users to reverse tabnabbing attacks where the linked page could manipulate the origin page.
**Learning:** `DOMPurify`'s `ADD_ATTR` option only allows attributes but does not enforce values. To enforce `rel="noopener noreferrer"`, a hook (`afterSanitizeAttributes`) is required.
**Prevention:** Implemented a global `DOMPurify` hook in `src/utils/sanitize.ts` that automatically appends `noopener noreferrer` to any anchor tag with `target="_blank"`, while preserving existing `rel` values.
