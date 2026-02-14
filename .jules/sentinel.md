# Sentinel's Journal

## 2025-05-22 - Missing Reverse Tabnabbing Protection
**Vulnerability:** Links with `target="_blank"` were not automatically getting `rel="noopener noreferrer"`.
**Learning:** `DOMPurify` does not automatically add `rel="noopener noreferrer"` to `target="_blank"` links unless explicitly configured or hooked. The `ADD_ATTR: ['target']` configuration was insufficient.
**Prevention:** Added a global `DOMPurify.addHook('afterSanitizeAttributes', ...)` in `src/utils/sanitize.ts` to enforce this relationship. This pattern should be maintained if sanitization logic changes.
