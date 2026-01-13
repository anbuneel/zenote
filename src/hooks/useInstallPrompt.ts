import { useState, useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Hook to manage PWA install prompt with engagement tracking.
 *
 * Features:
 * - Captures beforeinstallprompt event (singleton pattern)
 * - Tracks user engagement (notes created, visits)
 * - Shows custom prompt after engagement threshold
 * - Respects user dismissal
 * - iOS Safari detection with visual install guide
 */

// Engagement thresholds
const ENGAGEMENT_THRESHOLD = {
  notesCreated: 3,
  visits: 2,
};

/**
 * Detect iOS device (iPhone, iPad, iPod)
 */
function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  // Check for iOS devices
  const isIOSUserAgent = /iPad|iPhone|iPod/.test(navigator.userAgent);

  // Check for iPad on iOS 13+ (reports as Mac)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;

  // Exclude MSStream (IE detection)
  const isMSStream = 'MSStream' in window;

  return (isIOSUserAgent || isIPadOS) && !isMSStream;
}

/**
 * Detect Safari browser (not Chrome, Firefox, etc. on iOS)
 */
function detectSafari(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;

  // Safari includes "Safari" but excludes Chrome/Firefox/etc.
  // CriOS = Chrome on iOS, FxiOS = Firefox on iOS
  return /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Standard check
  const standaloneMedia = window.matchMedia('(display-mode: standalone)').matches;

  // iOS Safari specific
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;

  return standaloneMedia || iosStandalone;
}

const STORAGE_KEYS = {
  engagement: 'yidhan-engagement',
  installDismissed: 'yidhan-install-dismissed',
  installPrompted: 'yidhan-install-prompted',
  iosGuideDismissed: 'yidhan-ios-guide-dismissed',
};

interface EngagementData {
  notesCreated: number;
  visits: number;
  lastVisit: string;
}

// BeforeInstallPromptEvent type (not in standard TypeScript lib)
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Singleton state for deferred prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInitialized = false;
const subscribers = new Set<() => void>();

function getSnapshot(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

function getServerSnapshot(): BeforeInstallPromptEvent | null {
  return null;
}

function subscribe(callback: () => void): () => void {
  subscribers.add(callback);

  // Set up event listeners only once
  if (!isInitialized) {
    isInitialized = true;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      subscribers.forEach((cb) => cb());
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      subscribers.forEach((cb) => cb());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
  }

  return () => {
    subscribers.delete(callback);
  };
}

function getInitialEngagement(): EngagementData {
  const today = new Date().toDateString();
  let data: EngagementData = { notesCreated: 0, visits: 0, lastVisit: '' };

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.engagement);
    if (stored) {
      data = JSON.parse(stored);
    }
  } catch {
    // Fallback to defaults
  }

  // Track visit if last visit was a different day
  if (data.lastVisit !== today) {
    data = {
      ...data,
      visits: data.visits + 1,
      lastVisit: today,
    };
    localStorage.setItem(STORAGE_KEYS.engagement, JSON.stringify(data));
  }

  return data;
}

export function useInstallPrompt() {
  const prompt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const [engagement, setEngagement] = useState<EngagementData>(getInitialEngagement);

  const [isDismissed, setIsDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.installDismissed) === 'true'
  );

  const [hasBeenPrompted, setHasBeenPrompted] = useState(
    () => localStorage.getItem(STORAGE_KEYS.installPrompted) === 'true'
  );

  const [isIOSGuideDismissed, setIsIOSGuideDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEYS.iosGuideDismissed) === 'true'
  );

  // Platform detection (memoized to avoid recalculation)
  const isIOS = useMemo(() => detectIOS(), []);
  const isSafari = useMemo(() => detectSafari(), []);
  const isInstalled = useMemo(() => isStandaloneMode(), []);

  // Track note creation (called by App.tsx)
  const trackNoteCreated = useCallback(() => {
    setEngagement((prev) => {
      // Skip update if threshold already met (optimization)
      if (prev.notesCreated >= ENGAGEMENT_THRESHOLD.notesCreated) {
        return prev;
      }
      const updated = {
        ...prev,
        notesCreated: prev.notesCreated + 1,
      };
      localStorage.setItem(STORAGE_KEYS.engagement, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check if engagement threshold is met
  const isEngaged =
    engagement.notesCreated >= ENGAGEMENT_THRESHOLD.notesCreated ||
    engagement.visits >= ENGAGEMENT_THRESHOLD.visits;

  // Should show custom install prompt
  const shouldShowPrompt =
    prompt !== null && isEngaged && !isDismissed && !hasBeenPrompted;

  // Trigger native install prompt
  const triggerInstall = useCallback(async () => {
    if (!prompt) return false;

    setHasBeenPrompted(true);
    localStorage.setItem(STORAGE_KEYS.installPrompted, 'true');

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      return choice.outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    } finally {
      // Clear prompt after any completion (accept or dismiss)
      // A consumed prompt cannot be reused
      deferredPrompt = null;
      subscribers.forEach((cb) => cb());
    }
  }, [prompt]);

  // Dismiss prompt permanently
  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEYS.installDismissed, 'true');
  }, []);

  // Dismiss iOS guide
  const dismissIOSGuide = useCallback(() => {
    setIsIOSGuideDismissed(true);
    localStorage.setItem(STORAGE_KEYS.iosGuideDismissed, 'true');
  }, []);

  // Check if app is installable (prompt available for Chrome/Android)
  const isInstallable = prompt !== null;

  // Should show iOS install guide
  // Show only for iOS Safari users who haven't installed and haven't dismissed
  const shouldShowIOSGuide =
    isIOS && isSafari && !isInstalled && !isIOSGuideDismissed && isEngaged;

  // Can install on iOS (show in UI even without guide)
  const canInstallOnIOS = isIOS && isSafari && !isInstalled;

  return {
    // Chrome/Android install
    isInstallable,
    shouldShowPrompt,
    triggerInstall,
    dismissPrompt,

    // iOS install guide
    isIOS,
    isSafari,
    shouldShowIOSGuide,
    canInstallOnIOS,
    dismissIOSGuide,

    // Common
    isInstalled,
    trackNoteCreated,
  };
}
