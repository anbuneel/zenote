## 2024-05-23 - Strict Environment Variables Requirement
**Learning:** The application's `src/lib/supabase.ts` performs a strict runtime check for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If these are missing from `.env`, the application crashes immediately on startup, even if the user only intends to use the `/demo` (offline) route.
**Action:** When running the application locally or in CI/CD (including for Playwright verification), always ensure a `.env` file exists with at least dummy values for these keys to prevent the app from blocking execution.
