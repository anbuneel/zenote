# Encryption Capability Analysis

**Version:** 2.0
**Last Updated:** 2026-01-10
**Status:** Draft
**Author:** Claude (Opus 4.5)

---

## Original Prompt

> How can we implement encryption capability? How complex is it? Give me a recommendation. Think harder as this is an important feature of the app.

**Follow-up requirement:**
> Even I as the app developer shouldn't be able to see anyone's notes!

---

## Executive Summary

This document analyzes encryption options for Zenote, comparing complexity, trade-offs, and alignment with the app's philosophy.

**Key Requirement:** Zero-knowledge architecture where even the app developer cannot access user notes.

**Revised Recommendation:** Given the zero-knowledge requirement, the recommended approach is now **Full E2EE (Standard Notes-style)** - all notes encrypted by default with keys derived from user password. This is more complex (~6-8 weeks) but is the only approach that truly prevents developer access.

---

## Competitive Analysis: How Other Apps Handle Encryption

### Notion: NO E2EE ❌

Notion does **not** offer end-to-end encryption:

- ✅ Encryption in transit (TLS)
- ✅ Encryption at rest (AES-256 on AWS servers)
- ❌ **No E2EE** - Notion employees CAN technically read your notes

**Source:** [Notion Security Practices](https://www.notion.com/help/security-and-privacy)

**Implication:** Notion prioritizes features (search, collaboration, sharing) over zero-knowledge privacy.

---

### Bear: Optional Per-Note E2EE ⚠️ (Partial)

Bear takes a hybrid approach:

- Uses **iCloud CloudKit** for sync (Apple's encryption)
- **Optional E2EE** for individual notes (Bear Pro feature)
- Uses [Themis library](https://www.cossacklabs.com/case-studies/bear/) with AES-GCM-256
- Password stored in **Apple SecureEnclave** for biometric unlock
- [Bear 2.4 (May 2025)](https://blog.bear.app/2025/05/bear-2-4-update-better-encryption-smarter-todo-and-more/) added encrypted attachments

**Key quote:** "The Bear team never gets access to any notes or that password."

**Limitation:** Only encrypted notes are truly private. Unencrypted notes sync through iCloud where Apple could theoretically access them.

**Source:** [Bear Encryption Blog](https://blog.bear.app/2023/10/encryption-bear-and-your-private-data/)

---

### Standard Notes: Full E2EE by Design ✅ (Gold Standard)

Standard Notes is the benchmark for zero-knowledge note apps:

- **ALL notes encrypted** before leaving your device
- Server is treated as ["non-trustworthy entity"](https://standardnotes.com/help/security/encryption)
- Open-source, [audited encryption specification](https://standardnotes.com/help/security)
- Even if their servers are hacked, attackers get only encrypted gibberish
- **You own the keys** - Standard Notes literally cannot read your notes

**Architecture principle:** The server is "dumb storage" - it only stores and retrieves encrypted blobs.

**Source:** [Standard Notes Encryption Whitepaper](https://standardnotes.com/help/security/encryption)

---

### Comparison Matrix

| Feature | Notion | Bear | Standard Notes | **Zenote (Goal)** |
|---------|--------|------|----------------|-------------------|
| Developer can read notes | ✅ Yes | ⚠️ Unencrypted only | ❌ Never | ❌ Never |
| E2EE available | ❌ No | ✅ Per-note (opt-in) | ✅ All notes (default) | ✅ All notes |
| Search works | ✅ Server-side | ✅ Full | ⚠️ Client-side only | ⚠️ Client-side only |
| Sharing works | ✅ Full | ✅ Full | ⚠️ Limited | ⚠️ Needs redesign |
| Zero-knowledge | ❌ No | ⚠️ Partial | ✅ Yes | ✅ Yes |
| Open-source crypto | N/A | ✅ Themis | ✅ Custom spec | ✅ Web Crypto API |
| Password lost = data lost | N/A | ⚠️ Encrypted only | ✅ Yes | ✅ Yes |

---

## Current State

Supabase already provides **encryption at rest** (AWS encrypts the underlying storage). This protects against physical disk theft but not against someone with database access (including the app developer).

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

### 3. Full E2EE (High Complexity) ⭐ RECOMMENDED FOR ZERO-KNOWLEDGE

```
┌─────────────────────────────────────────────────────────────┐
│  USER'S DEVICE                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ User types  │ → │ Derive key   │ → │ Encrypt with   │  │
│  │ "My secret" │    │ from password│    │ AES-256-GCM   │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│                                                ↓            │
│                                    "X8f2kL9..." (ciphertext)│
└────────────────────────────────────────────────┬────────────┘
                                                 ↓
┌────────────────────────────────────────────────┴────────────┐
│  SERVER (Supabase) - "Dumb Storage"                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  content: "X8f2kL9mNpQrStUvWxYz..."                 │   │
│  │  (Developer sees only gibberish - CANNOT decrypt)   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**How it works:**
- Master password required to use app (separate from login, or combined)
- All notes encrypted with AES-256-GCM before leaving device
- Key derived via Argon2/PBKDF2 from password + user-specific salt
- Server stores only encrypted blobs - treated as untrusted
- Decryption happens only on user's device

| Aspect | Assessment |
|--------|------------|
| **Pros** | Maximum privacy, zero-knowledge, developer cannot access notes |
| **Cons** | Breaks server-side search, sharing needs redesign, password lost = all data lost |
| **Effort** | ~6-8 weeks |
| **Breaks** | Server-side search, "Share as Letter" (needs rework), real-time preview |

---

## Recommendation: Option 3 (Full E2EE) - For Zero-Knowledge Requirement

Given the requirement that **even the developer cannot see notes**, only Option 3 satisfies this constraint.

### Why Full E2EE is Required

| Approach | Developer Can See Notes? |
|----------|--------------------------|
| Server-side encryption | ✅ Yes (keys on server) |
| Optional per-note E2EE | ⚠️ Unencrypted notes only |
| **Full E2EE** | ❌ **Never** |

### Trade-offs to Accept

For true zero-knowledge, these features **must change**:

| Feature | Current | With Full E2EE |
|---------|---------|----------------|
| **Search** | Server-side, instant | Client-side only, loads all notes |
| **Share as Letter** | Generate link, anyone can view | Must include decryption key in link or separate channel |
| **Password recovery** | Email reset | ❌ Impossible - forgot password = lost data |
| **Note previews** | Server can render | Must decrypt on client first |
| **Multi-device** | Automatic sync | Need to enter password on each device |

### Alignment with Zenote Philosophy

| Principle | How Full E2EE Aligns |
|-----------|----------------------|
| **Wabi-sabi** | Accepts imperfection - no password recovery is honest limitation |
| **Calm technology** | No anxiety about data breaches - your notes are truly private |
| **Honest presence** | Clear warning: "Your password is your key. We cannot recover it." |
| **Organic** | Natural evolution - privacy as a core value, not an afterthought |

---

## Proposed UX for Full E2EE

### First-Time Setup (After Signup)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     🔐 Secure Your Notes                    │
│                                                             │
│  Your notes will be encrypted with a password only you      │
│  know. Not even Zenote can read them.                       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Encryption Password: [••••••••••••••••]              │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Confirm Password:    [••••••••••••••••]              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️ Important: This password cannot be recovered.          │
│  If you forget it, your notes are permanently lost.        │
│                                                             │
│  □ I understand and accept this responsibility             │
│                                                             │
│                    [ Set Up Encryption ]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Login Flow (Returning User)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                     🔓 Unlock Your Notes                    │
│                                                             │
│  Enter your encryption password to access your notes.       │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Encryption Password: [••••••••••••••••]              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  □ Remember on this device (use biometrics)                │
│                                                             │
│                       [ Unlock ]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Note Cards (All Encrypted by Default)

```
┌─────────────────────────────────────────┐
│  Note Card                         🔐   │  ← All notes show lock icon
│  ─────────────────────────────────────  │
│  My Private Thoughts                    │    (decrypted on client)
│  Today I reflected on...                │
└─────────────────────────────────────────┘
```

### Search (Client-Side Only)

```
┌─────────────────────────────────────────────────────────────┐
│  🔍 Search notes...                              [Cmd+K]    │
│  ───────────────────────────────────────────────────────── │
│  Searching locally (your notes never leave your device)    │
└─────────────────────────────────────────────────────────────┘
```

### Share as Letter (Redesigned)

```
┌─────────────────────────────────────────────────────────────┐
│                     📬 Share as Letter                      │
│                                                             │
│  This note will be encrypted in the link. The recipient    │
│  will need the password to read it.                        │
│                                                             │
│  Link: https://zenote.app/s/abc123#key=xyz789              │
│        └─────────────┘ └─────────────────────┘             │
│         (server sees)   (only in URL fragment,             │
│                          never sent to server)             │
│                                                             │
│  Expires: [7 days ▾]                                       │
│                                                             │
│  [ Copy Link ]  [ Copy Link + Send Password Separately ]   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
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

## Effort Breakdown (Full E2EE)

| Task | Estimate |
|------|----------|
| **Phase 1: Core Encryption** | |
| Encryption utilities (encrypt/decrypt/deriveKey) | 3-4 days |
| Database schema changes (encrypted content column) | 1 day |
| Key derivation with Argon2/PBKDF2 | 2 days |
| **Phase 2: Auth Flow Changes** | |
| First-time encryption setup UI | 3-4 days |
| Unlock prompt on app load | 2-3 days |
| Biometric unlock integration (Capacitor) | 3-4 days |
| **Phase 3: Feature Rewrites** | |
| Client-side search implementation | 4-5 days |
| Share as Letter with encryption | 3-4 days |
| Offline sync with encrypted content | 3-4 days |
| **Phase 4: Migration & Testing** | |
| Existing user migration strategy | 2-3 days |
| Security testing & edge cases | 4-5 days |
| Documentation & user communication | 2 days |
| **Total** | **~6-8 weeks** |

### Migration Strategy for Existing Users

```
┌─────────────────────────────────────────────────────────────┐
│                  ⚠️ Security Upgrade                        │
│                                                             │
│  Zenote now encrypts all your notes. To continue, you      │
│  need to set an encryption password.                       │
│                                                             │
│  Your existing notes will be encrypted with this password. │
│  This is a one-time process.                               │
│                                                             │
│  [ Set Up Encryption ] or [ Export & Delete Account ]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

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

### Notion Approach (No E2EE)
Server-side encryption only. Does not meet zero-knowledge requirement.

### Bear Approach (Optional Per-Note E2EE)
Hybrid approach where users choose which notes to encrypt. Simpler (~3-4 weeks) but doesn't provide full zero-knowledge since unencrypted notes are still visible to developer.

### Standard Notes Approach (Full E2EE) ← CHOSEN
Full E2EE with all notes encrypted by default. Meets zero-knowledge requirement. This is the model to follow.

### Signal Protocol
Designed for messaging with forward secrecy. Overkill for single-user notes and adds unnecessary complexity.

### age Encryption
Modern, simple encryption tool. However, no native browser implementation - would require WASM bundle (~200KB+).

### Themis Library (Bear's Choice)
Mature, audited library used by Bear. Could be an alternative to Web Crypto API but adds ~50KB dependency.

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

### Technical References
- [Web Crypto API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Standard Notes Encryption Whitepaper](https://standardnotes.com/help/security/encryption)
- [Standard Notes Security Updates](https://standardnotes.com/help/security)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

### Competitive Analysis Sources
- [Notion Security Practices](https://www.notion.com/help/security-and-privacy)
- [Notion Privacy Practices](https://www.notion.com/help/privacy)
- [Bear Encryption Blog Post](https://blog.bear.app/2023/10/encryption-bear-and-your-private-data/)
- [Bear 2.4 Update (May 2025)](https://blog.bear.app/2025/05/bear-2-4-update-better-encryption-smarter-todo-and-more/)
- [Bear Encryption Roadmap 2025](https://community.bear.app/t/bear-s-encryption-roadmap-for-2025/15401)
- [Cossack Labs: E2EE in Bear](https://www.cossacklabs.com/case-studies/bear/)
- [Themis Library Implementation](https://www.cossacklabs.com/blog/end-to-end-encryption-in-bear-app/)

### Additional Reading
- [Zero-Knowledge Encryption Guide (Hivenet)](https://www.hivenet.com/post/zero-knowledge-encryption-the-ultimate-guide-to-unbreakable-data-security)
- [Bitwarden: E2EE and Zero Knowledge](https://bitwarden.com/blog/end-to-end-encryption-and-zero-knowledge/)

---

*This analysis will be revisited when encryption becomes a priority feature. Last updated: January 2026 (v2.0).*
