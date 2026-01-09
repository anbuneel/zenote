/**
 * useSoftPrompt Hook
 *
 * Determines when to show the soft signup prompt to demo users.
 * Follows a non-aggressive pattern aligned with Zenote's calm philosophy.
 */

import { useMemo, useEffect, useState } from 'react';
import type { DemoMetadata } from '../services/demoStorage';

// ============================================================================
// Constants
// ============================================================================

// Minimum notes before showing prompt (user-created, excludes welcome note)
const MIN_NOTES_FOR_PROMPT = 3;

// Minimum time spent in demo before showing prompt (5 minutes)
const MIN_TIME_FOR_PROMPT_MS = 5 * 60 * 1000;

// Cooldown period after dismissing prompt (24 hours)
const PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

// Cooldown period after dismissing ribbon (7 days)
const RIBBON_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// ============================================================================
// Hook
// ============================================================================

export interface UseSoftPromptOptions {
  metadata: DemoMetadata | null;
  userNoteCount: number;
  onDismissPrompt: () => void;
  onDismissRibbon: () => void;
}

export interface UseSoftPromptReturn {
  // Modal prompt (more prominent)
  shouldShowPrompt: boolean;
  dismissPrompt: () => void;

  // Inline nudge (less prominent, shown after modal dismissed)
  shouldShowInlineNudge: boolean;

  // Impermanence ribbon
  shouldShowRibbon: boolean;
  dismissRibbon: () => void;

  // Stats for display
  noteCount: number;
  timeSpentMinutes: number;
}

export function useSoftPrompt({
  metadata,
  userNoteCount,
  onDismissPrompt,
  onDismissRibbon,
}: UseSoftPromptOptions): UseSoftPromptReturn {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  // Update current time every minute to re-evaluate time-based conditions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate time spent in demo (in minutes)
  const timeSpentMinutes = useMemo(() => {
    if (!metadata) return 0;
    return Math.floor((currentTime - metadata.createdAt) / (60 * 1000));
  }, [metadata, currentTime]);

  // Check if user meets minimum requirements for prompt
  const meetsMinimumRequirements = useMemo(() => {
    if (!metadata) return false;

    // Must have created enough notes
    if (userNoteCount < MIN_NOTES_FOR_PROMPT) return false;

    // Must have spent enough time
    const timeSpent = currentTime - metadata.createdAt;
    if (timeSpent < MIN_TIME_FOR_PROMPT_MS) return false;

    return true;
  }, [metadata, userNoteCount, currentTime]);

  // Check if prompt was recently dismissed
  const promptRecentlyDismissed = useMemo(() => {
    if (!metadata?.promptDismissedAt) return false;
    const timeSinceDismiss = currentTime - metadata.promptDismissedAt;
    return timeSinceDismiss < PROMPT_COOLDOWN_MS;
  }, [metadata, currentTime]);

  // Check if ribbon was recently dismissed
  const ribbonRecentlyDismissed = useMemo(() => {
    if (!metadata?.ribbonDismissedAt) return false;
    const timeSinceDismiss = currentTime - metadata.ribbonDismissedAt;
    return timeSinceDismiss < RIBBON_COOLDOWN_MS;
  }, [metadata, currentTime]);

  // Should show the modal prompt
  const shouldShowPrompt = useMemo(() => {
    // Must meet minimum requirements
    if (!meetsMinimumRequirements) return false;

    // Must not have been recently dismissed
    if (promptRecentlyDismissed) return false;

    // Must not have been dismissed at all in this session
    // (We only show the modal once per session until cooldown expires)
    if (metadata?.promptDismissedAt) return false;

    return true;
  }, [meetsMinimumRequirements, promptRecentlyDismissed, metadata?.promptDismissedAt]);

  // Should show inline nudge (fallback after modal dismissed)
  const shouldShowInlineNudge = useMemo(() => {
    // Only show if user has dismissed the modal but still has enough notes
    if (!metadata?.promptDismissedAt) return false;
    if (userNoteCount < MIN_NOTES_FOR_PROMPT) return false;
    return true;
  }, [metadata?.promptDismissedAt, userNoteCount]);

  // Should show impermanence ribbon
  const shouldShowRibbon = useMemo(() => {
    // Don't show if recently dismissed
    if (ribbonRecentlyDismissed) return false;
    return true;
  }, [ribbonRecentlyDismissed]);

  return {
    shouldShowPrompt,
    dismissPrompt: onDismissPrompt,

    shouldShowInlineNudge,

    shouldShowRibbon,
    dismissRibbon: onDismissRibbon,

    noteCount: userNoteCount,
    timeSpentMinutes,
  };
}
