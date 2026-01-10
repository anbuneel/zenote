# Encryption Capability Analysis

**Version:** 1.0
**Last Updated:** 2026-01-09
**Status:** Draft
**Author:** Claude (Opus 4.5)

---

## Original Prompt

> How can we implement encryption capability? How complex is it? Give me a recommendation. Think harder as this is an important feature of the app.

---

## Executive Summary

This document analyzes encryption options for Zenote, comparing complexity, trade-offs, and alignment with the app's philosophy. The recommended approach is **Optional E2EE for "Private Notes"** - allowing users to mark specific notes as encrypted while keeping regular notes fully functional.

---

## Current State

Supabase already provides **encryption at rest** (AWS encrypts the underlying storage). This protects against physical disk theft but not against someone with database access.

---

## Three Approaches

### 1. Server-Side Column Encryption (Low Complexity)

```
User → Supabase → pgcrypto encrypts → PostgreSQL
```

**How it works:**
- Use PostgreSQL's `pgcrypto` extension
- Encrypt `content` column with server-managed key
- Transparent to the app code

| Aspect | Assessment |
|--------|------------|
| **Pros** | Simple, no client changes, search still works |
| **Cons** | Supabase/admin can still read notes; not true privacy |
| **Effort** | ~1 week |
| **Breaks** | Nothing |

---

### 2. Optional E2EE for "Private Notes" (Medium Complexity) ⭐ RECOMMENDED

```
User → Web Crypto API → Encrypted blob → Supabase
        (client-side)     (unreadable)
```

**How it works:**
- User sets an "encryption password" in Settings (separate from login)
- Toggle notes as "Private" - these get encrypted before sync
- Regular notes work exactly as before
- Private notes excluded from search, can't be shared

| Aspect | Assessment |
|--------|------------|
| **Pros** | Opt-in, doesn't break existing features, true E2EE for sensitive notes |
| **Cons** | Two passwords to remember, private notes not searchable, password forgotten = notes lost |
| **Effort** | ~3-4 weeks |
| **Breaks** | Search for private notes only, sharing for private notes only |

---

### 3. Full E2EE (High Complexity)

```
User → Derive key from password → Encrypt ALL notes → Supabase
                                    (server sees nothing)
```

**How it works:**
- Master password required to use app
- All notes encrypted with AES-256-GCM
- Key derived via Argon2/PBKDF2

| Aspect | Assessment |
|--------|------------|
| **Pros** | Maximum privacy (like Standard Notes) |
| **Cons** | Breaks search, sharing, real-time sync preview; password lost = all data lost |
| **Effort** | ~6-8 weeks |
| **Breaks** | Search, "Share as Letter", real-time sync, multi-device without key sync |

---

## Recommendation: Option 2 (Optional E2EE)

This fits Zenote's philosophy of **calm simplicity with thoughtful depth**:

| Principle | How It Aligns |
|-----------|---------------|
| **Wabi-sabi** | Imperfect by design - user chooses what to protect |
| **Non-intrusive** | Regular notes work exactly as before |
| **Honest** | Clear that "private = no search, no recovery" |
| **Organic** | Natural extension of existing "pin" concept |

---

## Proposed UX

### Note Card with Lock Indicator

```
┌─────────────────────────────────────────┐
│  Note Card                         🔒   │  ← Lock icon for private notes
│  ─────────────────────────────────────  │
│  Private Journal Entry                  │
│  [encrypted preview unavailable]        │
└─────────────────────────────────────────┘
```

### Settings Modal - New "Privacy" Tab

```
┌─────────────────────────────────────────┐
│  🔐 Private Notes                       │
│                                         │
│  Encryption Password: [••••••••••]      │
│                                         │
│  ⚠️ This password cannot be recovered.  │
│  If forgotten, private notes are lost.  │
│                                         │
│  [Set Password]                         │
└─────────────────────────────────────────┘
```

### Editor - Private Toggle

```
┌─────────────────────────────────────────┐
│  📌 Pin    🔒 Private    🏷️ Tags        │
└─────────────────────────────────────────┘
```

---

## Technical Implementation

### Web Crypto API (Built-in, No Dependencies)

```typescript
// Derive encryption key from password
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt note content
async function encrypt(content: string, key: CryptoKey): Promise<EncryptedData> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(content)
  );
  return {
    ciphertext: arrayToBase64(ciphertext),
    iv: arrayToBase64(iv)
  };
}

// Decrypt note content
async function decrypt(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArray(iv) },
    key,
    base64ToArray(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}
```

### Database Changes

```sql
-- Add encryption columns to notes
ALTER TABLE notes ADD COLUMN is_private boolean DEFAULT false;
ALTER TABLE notes ADD COLUMN encryption_iv text;
-- content stores base64 ciphertext when is_private = true

-- Salt stored per user (NOT the password/key)
-- In user_metadata: { encryption_salt: "base64..." }
```

### New Files to Create

```
src/
├── utils/
│   └── encryption.ts      # Encrypt/decrypt/deriveKey utilities
├── hooks/
│   └── useEncryption.ts   # React hook for encryption state
├── components/
│   ├── PrivateToggle.tsx  # Toggle button for marking notes private
│   └── PasswordPrompt.tsx # Modal for entering encryption password
```

---

## Key Design Decisions

| Question | Options | Recommendation |
|----------|---------|----------------|
| **Password storage** | Memory only (re-enter on refresh) vs. IndexedDB (persists) | Memory only (more secure) |
| **Offline private notes** | Allow (cache key) vs. Require online | Allow with cached key |
| **Sharing private notes** | Disallow vs. Decrypt-then-share | Disallow (simpler, clearer) |
| **Can private become public?** | Yes vs. No | Yes (decrypt and save as regular) |
| **Password hint** | Allow vs. No hints | Optional hint (user's choice) |

---

## Effort Breakdown

| Task | Estimate |
|------|----------|
| Encryption utilities (encrypt/decrypt/derive) | 2-3 days |
| Database schema changes | 1 day |
| Settings UI (password setup/change) | 2-3 days |
| Editor integration (private toggle) | 2 days |
| Note card private indicator | 1 day |
| Offline sync for encrypted notes | 3-4 days |
| Password prompt on app load | 2 days |
| Testing & edge cases | 3-4 days |
| **Total** | **~3-4 weeks** |

---

## Security Considerations

### Strengths
- AES-256-GCM is industry standard
- PBKDF2 with 100k iterations resists brute force
- Keys never leave the client
- Server stores only encrypted blobs

### Limitations
- Browser environment (Web Crypto) is less secure than native
- Key cached in memory could be extracted via browser devtools
- No protection against keyloggers or compromised devices
- Password strength depends on user

### Mitigations
- Auto-lock after inactivity (configurable timeout)
- Clear key from memory on logout
- Warn users about password strength
- Consider biometric unlock on native (Capacitor) apps

---

## Alternatives Considered

### Standard Notes Approach
Full E2EE with encrypted search index. Too complex for Zenote's philosophy.

### Signal Protocol
Designed for messaging, overkill for single-user notes.

### age Encryption
Modern, simple, but no browser implementation without WASM.

---

## Open Questions

1. Should private notes be excluded from export, or exported encrypted?
2. What happens to private notes during account offboarding ("Letting Go")?
3. Should we support multiple encryption passwords (for different sensitivity levels)?
4. Is there demand for hardware key support (WebAuthn/FIDO2)?

---

## Next Steps

When ready to implement:

1. Create detailed implementation plan in `docs/plans/`
2. Design database migration strategy
3. Create UI mockups for password setup flow
4. Decide on key design decisions above
5. Implement in phases (utilities → UI → integration → offline)

---

## References

- [Web Crypto API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Standard Notes Architecture](https://docs.standardnotes.com/specification/encryption)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

*This analysis will be revisited when encryption becomes a priority feature.*
