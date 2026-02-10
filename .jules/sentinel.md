## Sentinel Security Journal

## 2026-02-10 - [Reverse Tabnabbing Vulnerability]
**Vulnerability:** Found `sanitizeHtml` allowing `target="_blank"` on `<a>` tags without enforcing `rel="noopener noreferrer"`.
**Learning:** `DOMPurify` does not automatically enforce `noopener` or `noreferrer` for `target="_blank"` unless explicitly hooked or configured with specific options (though modern browsers do default to `noopener`). Relying on defaults is insufficient for robust security.
**Prevention:** Always use `DOMPurify.addHook('afterSanitizeAttributes', ...)` to explicitly set `rel` attributes for `target="_blank"` links to prevent reverse tabnabbing and protect user privacy.
