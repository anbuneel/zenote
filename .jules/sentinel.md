## Sentinel Journal

## 2025-02-18 - Input Validation Gap in Notes Service
**Vulnerability:** The notes service (`createNote`, `updateNote`) accepted arbitrary length strings and raw HTML without validation, relying solely on frontend display-time sanitization.
**Learning:** While display-time sanitization (DOMPurify in `NoteCard`) prevents XSS for the current client, the lack of input validation allowed:
1. Potential DoS via massive payloads (e.g. 100MB strings).
2. Stored XSS risks if data is ever consumed by other clients (e.g. admin dashboard, mobile app) that assume trusted DB content.
**Prevention:** Enforce input validation (length limits) and sanitization (HTML stripping/cleaning) at the service layer (boundary) before persistence, ensuring "defense in depth".
