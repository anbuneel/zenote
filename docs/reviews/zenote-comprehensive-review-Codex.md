# Zenote Comprehensive Architecture, Design, and Code Review (Codex)

Author: Codex
Date: 2025-12-28
Update: 2025-12-28 (reviewed commit 368e912 "feat: Add API retry logic with exponential backoff")
Original Prompt:
do a comprehensive architecture, design and code review of Zenote. I want to launch this product for other users and want to ensure I am putting a great product out. Use this doc for reference: C:\anbs-dev\zenote-claude-code\docs\reviews\code-review\zenote-review-prompt.md. Let me know for any clarifying questions.

## Findings
- [OPEN] Critical: Public RLS policy on `note_shares` lets anyone enumerate share tokens (USING (true)), undermining "secret link" security. `supabase/migrations/add_note_shares.sql:24`
- [OPEN] Critical: Shared notes render raw HTML without sanitization, enabling stored XSS for recipients if any unsafe content is saved/imported. `src/components/SharedNoteView.tsx:260`
- [COMPLETED] High: Save state was optimistic; "Saved" appeared even if the backend write failed. Resolved in commit 368e912 with async save status, retries, error UI, and toast. `src/components/Editor.tsx:63`, `src/App.tsx:378`
- [OPEN] High: Offline messaging promises sync without any queue; wording still implies offline writes will safely sync. `src/hooks/useNetworkStatus.ts:31`
- [OPEN] High: Rollback on failed save can overwrite a newer successful save when multiple saves overlap (previousNote applied unconditionally). `src/App.tsx:381`
- [OPEN] High: Overlapping saves are now more likely because App-level debounce was removed and there is no in-flight tracking; auto-save plus blur/Escape can race. `src/components/Editor.tsx:102`, `src/App.tsx:378`
- [OPEN] High: Deleting a note uses a stale `notes` snapshot after an async call, which can drop concurrent updates or realtime inserts. `src/App.tsx:422`
- [OPEN] Medium: Escape/back triggers an async save but does not await completion before navigation; failure may surface after leaving the editor. `src/components/Editor.tsx:125`
- [OPEN] Medium: Retry logic treats all errors as retryable (including non-retryable 4xx/validation), adding delay without benefit. `src/utils/withRetry.ts:40`
- [OPEN] Medium: Session replay is enabled without explicit masking; for a notes product this can capture sensitive content unless privacy scrubbing is configured. `src/main.tsx:31`
- [OPEN] Medium: Faded-note retention is enforced client-side; if users do not open the app, notes can persist beyond 30 days. `src/services/notes.ts:347`, `supabase/migrations/add_faded_notes_cleanup_cron.sql:1`
- [OPEN] Medium: State updates during render in chapter components can cause extra renders or StrictMode warnings. `src/components/ChapterSection.tsx:43`, `src/components/TimeRibbon.tsx:66`
- [OPEN] Medium: Scalability risks: full Masonry render, %ilike% search, and refetch-on-selection will slow with large note counts. `src/components/ChapterSection.tsx:165`, `src/services/notes.ts:256`, `src/App.tsx:165`
- [OPEN] Low: Accessibility gaps: nested interactive elements in tag pills and custom "button-like" containers only handle Enter (not Space). `src/components/TagPill.tsx:62`, `src/components/NoteCard.tsx:63`, `src/components/ChapterSection.tsx:94`
- [OPEN] Low: Save error indicator uses undefined design tokens (`--color-error*`), relying on fallback colors. `src/components/Editor.tsx:348`

## Questions / Assumptions
- How are shared notes authorized beyond tokens? I do not see a secure RPC or policy for reading `notes` by share token in the repo. If it exists elsewhere, please point me to it. `src/services/notes.ts:533`
- Is GitHub OAuth intended for launch? The UI exposes it but it will fail if the provider is not configured. `src/components/Auth.tsx:760`
- Do you want true offline editing? If not, the offline copy should be softened or removed. `src/hooks/useNetworkStatus.ts:31`

## Strengths
- Cohesive design system with consistent tokens, typography, and wabi-sabi details.
- Clear separation between services/utils and UI, with Supabase types defined.
- Solid test surface with unit tests plus Playwright E2E.

## Next Steps
1. [OPEN] Lock down sharing (remove public token reads, use a security-definer RPC or edge function) and sanitize shared HTML.
2. [COMPLETED] Make save states truthful (surface failures and retries).
3. [OPEN] Prevent overlapping-save races (in-flight versioning/cancel, avoid rollback overwriting newer saves, await save on exit).
4. [OPEN] Clarify offline behavior or implement a sync queue; adjust offline messaging.
5. [OPEN] Run `npm run check` plus a11y/contrast and Lighthouse audits before launch.

Notes: No code changes made; tests and audits not run in this review.
