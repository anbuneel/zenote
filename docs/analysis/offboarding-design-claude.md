# Zenote Offboarding Design: "Letting Go"

**Author:** Claude (Opus 4.5)
**Date:** 2025-12-25
**Consulted:** Frontend Design Skill

---

## Original Prompt

> Design a user offboarding/account deletion flow for Zenote with:
> - Account deletion flow (net new feature)
> - Data export before deletion
> - Grace period before permanent deletion
> - Graceful and easy - no guilt-tripping, no dark patterns
> - Aligned with wabi-sabi philosophy

---

## Design Philosophy

Wabi-sabi teaches us that **departure is as natural as arrival**. Like autumn leaves releasing from branches, a user's departure should feel inevitable, graceful, and without friction. No guilt. No barriers. Just gratitude and a gentle goodbye.

---

## Core Concept: "Letting Go"

**Language palette:**
- "Let go" (not delete)
- "Depart" (not cancel)
- "Release" (not terminate)
- "Keepsakes" (not export/download)
- "Return" (not reactivate)

**Emotional tone:** A friend leaving a tea house, bowing gently at the door. Not a customer canceling a subscription.

---

## The Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Settings Modal          Departure Page           Grace Period    │
│   ─────────────          ──────────────           ────────────     │
│                                                                     │
│   [Let go of              Step 1: Intention        Account fades   │
│    Zenote]                     ↓                   for 14 days     │
│       │                   Step 2: Keepsakes             │          │
│       │                        ↓                        │          │
│       └──────────────→   Step 3: Farewell          [Return?]       │
│                               ↓                         │          │
│                          Grace begins              [Release]       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Flow

### Entry: Settings Modal

Add a third tab or section at the bottom of Settings:

```
┌─────────────────────────────────────────┐
│  Settings                           ✕   │
├─────────────────────────────────────────┤
│  [Profile]  [Password]                  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Display Name                    │   │
│  │  [_______________]               │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Theme                           │   │
│  │  [Light] [Dark]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│─────────────────────────────────────────│
│                                         │
│  Ready to move on?                      │
│  Let go of Zenote →                     │  ← Subtle, tertiary text
│                                         │
└─────────────────────────────────────────┘
```

**Design notes:**
- Position at bottom, separated by divider
- Tertiary text color (not prominent, but not hidden)
- No red, no warning colors
- Arrow suggests a journey, not an action

---

### Departure Page (Full-screen)

When user clicks "Let go of Zenote", transition to a dedicated full-page experience:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ← Back to settings                                                 │
│                                                                     │
│                                                                     │
│                                                                     │
│                         Letting Go                                  │
│                                                                     │
│              ─────────────────────────────                          │
│                                                                     │
│         Thank you for the quiet moments.                            │
│                                                                     │
│     Your notes will rest for 14 days, then release.                 │
│     You may return anytime before then.                             │
│                                                                     │
│                                                                     │
│                                                                     │
│         ┌─────────────────────────────────────┐                     │
│         │                                     │                     │
│         │  📦  Take your keepsakes            │                     │
│         │                                     │                     │
│         │  Download all your notes before     │                     │
│         │  you go. Your words belong to you.  │                     │
│         │                                     │                     │
│         │  [Download as Markdown]             │                     │
│         │  [Download as JSON]                 │                     │
│         │                                     │                     │
│         └─────────────────────────────────────┘                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                    [Begin Letting Go]                               │
│                                                                     │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Visual design:**
- Full-screen with generous white space
- Centered content, editorial layout
- Warm background (paper texture)
- Keepsakes card with subtle border, not harsh box
- Primary action is gold/terracotta accent, but not urgent

**Key copy:**
- "Thank you for the quiet moments" — gratitude, not guilt
- "rest for 14 days, then release" — echoes Faded Notes language
- "Your words belong to you" — empowering, respectful

---

### Confirmation Modal (After clicking "Begin Letting Go")

A gentle confirmation, not a warning:

```
┌─────────────────────────────────────────┐
│                                         │
│              Are you ready?             │
│                                         │
│    Your account will begin fading.      │
│    You have 14 days to return.          │
│                                         │
│    ┌─────────────────────────────────┐  │
│    │ Type "let go" to confirm        │  │
│    │ [_______________]               │  │
│    └─────────────────────────────────┘  │
│                                         │
│        [Stay a while]   [Let go]        │
│                                         │
└─────────────────────────────────────────┘
```

**Design notes:**
- Requires typing "let go" (not email, not password — softer)
- "Stay a while" — gentle alternative, not "Cancel"
- No red buttons, no warning icons

---

### Farewell Screen (After confirmation)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                                                                     │
│                                                                     │
│                                                                     │
│                         Until we meet again                         │
│                                                                     │
│                              · · ·                                  │
│                                                                     │
│                Your account is now fading.                          │
│                                                                     │
│         If you change your mind, simply sign in                     │
│              within 14 days to return.                              │
│                                                                     │
│                                                                     │
│                   [Return to Zenote]                                │
│                                                                     │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- User is signed out
- "Return to Zenote" goes to landing page
- During grace period, signing in shows restoration prompt

---

### Grace Period: The Fading Account

During the 14-day grace period, if user signs back in:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                                                                     │
│                        Welcome back                                 │
│                                                                     │
│              ─────────────────────────────                          │
│                                                                     │
│         Your account is fading quietly.                             │
│                                                                     │
│              Releasing in 11 days.                                  │
│                                                                     │
│                                                                     │
│                                                                     │
│                [Stay]        [Continue letting go]                  │
│                                                                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**"Stay" behavior:**
- Cancels the departure
- Restores account to normal state
- Shows brief "Welcome home" toast

**"Continue letting go" behavior:**
- Signs them out again
- Grace period continues

---

## Visual Language

### Color Palette for Offboarding

| Element | Color | Reasoning |
|---------|-------|-----------|
| Background | Warm paper | Consistent with app |
| Headings | Primary text | No alarm colors |
| Body text | Secondary text | Calm, readable |
| Primary button | Gold/terracotta | Gentle emphasis |
| Secondary button | Transparent + border | Soft alternative |
| Keepsakes card | Subtle bg + border | Inviting, not urgent |

### Typography

| Element | Style |
|---------|-------|
| "Letting Go" | Cormorant Garamond, 2.5rem, italic |
| "Thank you..." | Cormorant Garamond, 1.25rem |
| Body text | Inter, 0.95rem |
| Buttons | Inter, medium weight |

### Animation

- Page transitions: Fade in (300ms ease-out)
- Farewell screen: Gentle fade with slight upward float (like leaves)
- No harsh transitions, no shake effects

---

## Copy Reference

### Headlines
- "Letting Go"
- "Until we meet again"
- "Welcome back"

### Body Copy
- "Thank you for the quiet moments."
- "Your notes will rest for 14 days, then release."
- "You may return anytime before then."
- "Your words belong to you."
- "Your account is fading quietly."

### Button Labels
- "Let go of Zenote →"
- "Begin Letting Go"
- "Take your keepsakes"
- "Stay a while" / "Stay"
- "Let go"
- "Continue letting go"
- "Return to Zenote"

### Micro-copy
- "Type 'let go' to confirm"
- "Releasing in X days"
- "Welcome home" (toast on return)

---

## Technical Considerations

### Database
- Add `departing_at` timestamp to users table
- Null = active account
- Set = grace period active
- Cron job deletes accounts where `departing_at < now() - 14 days`

### Auth Flow
- Departing users can still sign in during grace period
- On sign-in, check `departing_at` and show restoration prompt
- "Stay" clears the `departing_at` field

### Data Export
- Reuse existing `exportNotesToJSON` and `downloadMarkdownZip` functions
- Run export before setting `departing_at`

### Email (Optional, Future)
- "Your account is fading" — sent on departure
- "7 days until release" — gentle reminder
- "Your account has been released" — final confirmation

---

## Component Structure

```
src/components/
├── SettingsModal.tsx        # Add "Let go" link
├── DeparturePage.tsx        # New: Full-screen departure journey
├── DepartureConfirm.tsx     # New: "Type let go" modal
├── FarewellScreen.tsx       # New: Post-departure message
├── WelcomeBackPrompt.tsx    # New: Shown on sign-in during grace
```

---

## What This Design Avoids

| Anti-pattern | Our approach |
|--------------|--------------|
| "Are you SURE?" warnings | Calm confirmation |
| Red delete buttons | Gold/terracotta accent |
| "We're sorry to see you go" | "Thank you for the quiet moments" |
| Hidden deletion options | Visible but subtle |
| Immediate deletion | 14-day grace period |
| Complex multi-step surveys | Simple, optional keepsakes |
| Guilt-inducing copy | Gratitude and respect |

---

## Alignment with Onboarding

This offboarding design mirrors the onboarding philosophy:

| Onboarding | Offboarding |
|------------|-------------|
| Demo content migration | Keepsakes export |
| "Save this note" CTA | "Take your keepsakes" |
| Welcome note for new users | "Thank you for the quiet moments" |
| Gentle email confirmation | Gentle departure confirmation |
| Can explore before committing | Can return during grace period |

Both flows respect user autonomy and avoid pressure tactics.

---

## Summary

The Zenote offboarding experience embodies wabi-sabi: **departure is natural, not a failure**. Users should feel respected, not retained. The 14-day grace period mirrors the Faded Notes pattern, and the language throughout evokes seasonal change — leaves falling, not contracts terminating.
