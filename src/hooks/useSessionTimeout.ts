import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseSessionTimeoutOptions {
  /** Minutes before session times out (null = never timeout, default: 30) */
  timeoutMinutes?: number | null;
  /** Minutes before timeout to show warning (default: 5) */
  warningMinutes?: number;
  /** Callback when warning period begins */
  onWarning?: () => void;
  /** Callback when session times out */
  onTimeout?: () => void;
  /** Whether timeout monitoring is active (default: true) */
  enabled?: boolean;
}

export interface UseSessionTimeoutResult {
  /** Reset the timeout timer (e.g., when user clicks "Stay") */
  resetTimeout: () => void;
  /** Minutes remaining until timeout (null if not in warning period) */
  minutesRemaining: number | null;
  /** Whether currently in warning period */
  isWarning: boolean;
}

/**
 * Hook that monitors user inactivity and triggers session timeout.
 *
 * Tracks activity events (mousedown, keydown, scroll, touchstart) and
 * resets the timeout timer on any activity. When the warning period begins,
 * it calls onWarning and starts a countdown. If no activity occurs, it
 * calls onTimeout when the full timeout period elapses.
 *
 * Uses Zen-inspired approach: session "fades" rather than "expires".
 *
 * @example
 * ```tsx
 * const { resetTimeout, minutesRemaining } = useSessionTimeout({
 *   timeoutMinutes: 30,
 *   warningMinutes: 5,
 *   onWarning: () => setShowModal(true),
 *   onTimeout: () => signOut(),
 *   enabled: Boolean(user),
 * });
 * ```
 */
export function useSessionTimeout({
  timeoutMinutes = 30,
  warningMinutes = 5,
  onWarning,
  onTimeout,
  enabled = true,
}: UseSessionTimeoutOptions = {}): UseSessionTimeoutResult {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Initialize with 0, will be set properly when timeout is reset
  const lastActivityRef = useRef(0);

  const [minutesRemaining, setMinutesRemaining] = useState<number | null>(null);
  const [isWarning, setIsWarning] = useState(false);

  // Stable refs for callbacks to avoid effect re-runs
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);
  // Track isWarning in a ref so event handlers see current value without re-registering
  const isWarningRef = useRef(isWarning);

  useEffect(() => {
    onWarningRef.current = onWarning;
    onTimeoutRef.current = onTimeout;
  }, [onWarning, onTimeout]);

  // Keep isWarningRef in sync with isWarning state
  useEffect(() => {
    isWarningRef.current = isWarning;
  }, [isWarning]);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetTimeout = useCallback(() => {
    clearAllTimers();
    setMinutesRemaining(null);
    setIsWarning(false);
    lastActivityRef.current = Date.now();

    // Skip timer setup if disabled or timeout is null ("never")
    if (!enabled || timeoutMinutes === null) return;

    const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    // Set warning timer
    warningRef.current = setTimeout(() => {
      setIsWarning(true);
      setMinutesRemaining(warningMinutes);
      onWarningRef.current?.();

      // Start countdown interval (update every minute)
      countdownRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, Math.ceil((timeoutMs - elapsed) / 60000));
        setMinutesRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
        }
      }, 60000); // Update every minute
    }, warningMs);

    // Set actual timeout
    timeoutRef.current = setTimeout(() => {
      clearAllTimers();
      setIsWarning(false);
      setMinutesRemaining(null);
      onTimeoutRef.current?.();
    }, timeoutMs);
  }, [enabled, timeoutMinutes, warningMinutes, clearAllTimers]);

  // Clear state when hook becomes disabled
  // This is a separate effect to reset state, triggered by the enabled flag
  useEffect(() => {
    if (!enabled) {
      // Use a microtask to avoid synchronous setState warning
      // This is valid because we're responding to a prop change
      queueMicrotask(() => {
        setMinutesRemaining(null);
        setIsWarning(false);
      });
    }
  }, [enabled]);

  // Attach event listeners for user activity
  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    const events = ['mousedown', 'keydown', 'touchstart'] as const;

    const handleActivity = () => {
      // Only reset if not already in warning state
      // (let the modal handle the reset via resetTimeout)
      // Use ref to avoid re-registering effect when isWarning changes
      if (!isWarningRef.current) {
        resetTimeout();
      }
    };

    // Use capture phase for scroll to catch events from nested scrollable containers
    const handleScroll = () => {
      if (!isWarningRef.current) {
        resetTimeout();
      }
    };

    // Add listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    // Scroll needs capture phase since scroll events don't bubble
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    // Initialize timeout on mount
    // Use queueMicrotask to avoid synchronous setState warning in effects
    queueMicrotask(resetTimeout);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('scroll', handleScroll, { capture: true });
      clearAllTimers();
    };
  }, [enabled, resetTimeout, clearAllTimers]);

  return { resetTimeout, minutesRemaining, isWarning };
}
