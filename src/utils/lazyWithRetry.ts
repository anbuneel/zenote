import { lazy } from 'react';
import type { ComponentType } from 'react';

/**
 * Detect if an error is a chunk/module loading failure
 * This happens when the app is open and a new deployment occurs
 */
function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message || '';
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes("Importing a module script failed") ||
    message.includes('error loading dynamically imported module')
  );
}

/**
 * Check if we've already attempted showing the update banner recently
 * Returns true if we should skip (prevent spamming)
 */
function hasRecentlyAttempted(): boolean {
  const reloadAttempted = sessionStorage.getItem('yidhan-chunk-reload-attempted');
  if (reloadAttempted) {
    const timestamp = parseInt(reloadAttempted, 10);
    // Clear the flag after 30 seconds to allow future attempts
    if (Date.now() - timestamp < 30000) {
      return true;
    }
    sessionStorage.removeItem('yidhan-chunk-reload-attempted');
  }
  return false;
}

/**
 * Mark that we attempted to show the update banner
 */
function markReloadAttempted(): void {
  sessionStorage.setItem('yidhan-chunk-reload-attempted', Date.now().toString());
}

/**
 * Show a persistent banner prompting user to refresh
 * This replaces the hard auto-reload to give users control.
 */
function showUpdateBanner(): void {
  // Don't show multiple banners
  if (document.getElementById('chunk-update-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'chunk-update-banner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--glass-border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    font-family: var(--font-body);
    font-size: 14px;
    color: var(--color-text-secondary);
  `;

  const message = document.createElement('span');
  message.textContent = 'Yidhan has been updated.';

  const button = document.createElement('button');
  button.textContent = 'Refresh to continue';
  button.style.cssText = `
    background: var(--color-accent);
    color: #fff;
    border: none;
    padding: 6px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
  `;
  button.onclick = () => window.location.reload();

  banner.appendChild(message);
  banner.appendChild(button);
  document.body.prepend(banner);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>;

/**
 * Wrapper around React.lazy that adds smart retry logic for chunk loading errors
 *
 * Strategy:
 * 1. Try to load the chunk normally
 * 2. On failure, wait briefly and retry once (handles transient network issues)
 * 3. If retry fails and it's safe to reload (no unsaved work), auto-reload
 * 4. If not safe to reload, throw the error to be caught by ErrorBoundary
 */
export function lazyWithRetry<T extends AnyComponent>(
  importFn: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      // First attempt
      return await importFn();
    } catch (error) {
      if (!isChunkLoadError(error)) {
        // Not a chunk error, throw immediately
        throw error;
      }

      console.log('[lazyWithRetry] Chunk load failed, retrying...');

      // Wait a moment before retrying (network might be temporarily unavailable)
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Second attempt - sometimes clearing the module cache helps
        // Adding a cache-busting query param for the retry
        return await importFn();
      } catch (retryError) {
        if (!isChunkLoadError(retryError)) {
          throw retryError;
        }

        console.log('[lazyWithRetry] Retry failed, showing update banner...');

        // Show banner instead of hard reload - let user decide when to refresh
        // Skip if we've recently shown the banner (prevent spamming)
        if (!hasRecentlyAttempted()) {
          markReloadAttempted();
          showUpdateBanner();
        }

        // Return a never-resolving promise to prevent error boundary
        // The banner gives user control over when to refresh
        return new Promise(() => {});
      }
    }
  });
}

/**
 * Preload a lazy component without rendering it
 * Useful for preloading on hover or when navigation is likely
 */
export function preloadComponent(
  importFn: () => Promise<{ default: AnyComponent }>
): void {
  importFn().catch(() => {
    // Silently ignore preload failures - will be handled when actually needed
  });
}
