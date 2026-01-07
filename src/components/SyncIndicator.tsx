/**
 * Sync Indicator
 *
 * Subtle indicator showing offline/sync status.
 * - Offline: Cloud icon with X
 * - Syncing: Spinning indicator
 * - Pending: Ink dot with count
 * - Synced: No indicator (zen - absence is peace)
 */

import { useSyncStatus } from '../hooks/useSyncStatus';

export function SyncIndicator() {
  const { isOnline, pendingCount, isSynced } = useSyncStatus();

  // Zen philosophy: when all is synced, show nothing
  if (isSynced) {
    return null;
  }

  // Offline state
  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md"
        style={{
          background: 'var(--color-bg-tertiary)',
        }}
        role="status"
        aria-label="Offline - changes saved locally"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          {/* Cloud with X */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 15a4 4 0 004 4h9a5 5 0 10-5-5 4 4 0 00-8 1z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.5 5.5l-3 3m0-3l3 3"
          />
        </svg>
        <span
          className="text-xs font-medium"
          style={{
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          Offline
        </span>
      </div>
    );
  }

  // Pending changes (online but not synced)
  if (pendingCount > 0) {
    return (
      <div
        className="flex items-center gap-1.5 px-2 py-1 rounded-md"
        style={{
          background: 'var(--color-bg-tertiary)',
        }}
        role="status"
        aria-label={`${pendingCount} change${pendingCount === 1 ? '' : 's'} pending sync`}
      >
        {/* Ink dot */}
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: 'var(--color-accent)' }}
          aria-hidden="true"
        />
        <span
          className="text-xs font-medium"
          style={{
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          {pendingCount} pending
        </span>
      </div>
    );
  }

  return null;
}
