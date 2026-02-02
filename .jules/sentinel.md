## 2025-05-21 - [DOMPurify Hooks for Security]
**Vulnerability:** Reverse Tabnabbing via `target="_blank"` links in user content.
**Learning:** `DOMPurify` by default allows `target="_blank"` without adding `rel="noopener noreferrer"`, leaving users vulnerable to phishing via tabnabbing.
**Prevention:** Use `DOMPurify.addHook('afterSanitizeAttributes', ...)` to programmatically enforce `rel="noopener noreferrer"` on all `<a>` tags with `target="_blank"`, overwriting any user input.
