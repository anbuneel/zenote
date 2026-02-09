## 2025-02-18 - Excessive Data Exposure in Shared Notes
**Vulnerability:** The `note_shares` table was configured with an RLS policy (`USING (true)`) that allowed any user (including anonymous) to list all rows. Since the `share_token` column (the secret key for accessing shared notes) is stored in this table, an attacker could enumerate all active share tokens and access any shared note without authorization.
**Learning:** RLS policies that use `USING (true)` for `SELECT` effectively make the table public. While this is necessary for "access by token" patterns where the user doesn't have a session, it must be paired with other restrictions (like only allowing access via a SECURITY DEFINER function that hides the table) or the secret itself must not be stored in plaintext (store a hash, query by hash).
**Prevention:**
1. Avoid `USING (true)` on tables containing secrets.
2. For "secret link" features, store a hash of the token in the database, not the token itself. The client sends the token, the server hashes it and looks it up. Listing hashes provides no value to an attacker.
3. Alternatively, use RPC functions with `SECURITY DEFINER` to encapsulate the lookup logic and revoke direct table access.
