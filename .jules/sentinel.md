# Sentinel Journal - Security Learnings

This journal records CRITICAL security learnings, vulnerability patterns, and architectural gaps found in the codebase.

Format:
## YYYY-MM-DD - [Title]
**Vulnerability:** [What you found]
**Learning:** [Why it existed]
**Prevention:** [How to avoid next time]

---

## 2026-02-05 - Missing Reverse Tabnabbing Protection
**Vulnerability:** Links with `target="_blank"` were not automatically getting `rel="noopener noreferrer"`, exposing users to reverse tabnabbing attacks where a malicious page could manipulate the source page.
**Learning:** `DOMPurify` cleans attributes but does not automatically enforce `rel="noopener noreferrer"` on target blanks unless specifically configured or hooked.
**Prevention:** Use `DOMPurify.addHook('afterSanitizeAttributes', ...)` to enforce secure attributes on external links globally.
