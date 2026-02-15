## 2025-02-18 - Missing rel="noopener noreferrer" in Sanitization
**Vulnerability:** User-generated content with `target="_blank"` links lacked `rel="noopener noreferrer"`, exposing the app to reverse tabnabbing attacks where the new page can manipulate the original page.
**Learning:** `DOMPurify` configuration `ADD_ATTR` only allows attributes but does not enforce values. Hooks like `afterSanitizeAttributes` are required to enforce security attributes.
**Prevention:** Registered a global `DOMPurify` hook in `src/utils/sanitize.ts` to automatically add `rel="noopener noreferrer"` to all external links.
