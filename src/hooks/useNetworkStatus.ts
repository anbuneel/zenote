import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface NetworkStatus {
  /** Whether the browser reports being online */
  isOnline: boolean;
  /** Callback to manually trigger sync (used by sync engine) */
  onReconnect: (callback: () => void) => void;
}

/**
 * Hook that monitors network connectivity and shows toast notifications
 * when the user goes offline or comes back online.
 *
 * Uses Zen-inspired messaging that aligns with wabi-sabi design:
 * - Offline is presented as natural, not alarming
 * - Online return is quiet, not celebratory
 *
 * Also returns network status for sync engine integration.
 */
export function useNetworkStatus(): NetworkStatus {
  // Initialize with current online state (no need to set in effect)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  // Track if we were previously offline (initialized based on current state)
  const wasOffline = useRef(!navigator.onLine);
  const reconnectCallbacks = useRef<Set<() => void>>(new Set());

  const onReconnect = useCallback((callback: () => void) => {
    reconnectCallbacks.current.add(callback);
    return () => reconnectCallbacks.current.delete(callback);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline.current) {
        toast('The path has cleared.', {
          icon: '〇',
          duration: 3000,
          style: {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--glass-border)',
          },
        });

        // Trigger all reconnect callbacks (for sync engine)
        reconnectCallbacks.current.forEach((cb) => cb());
      }
      wasOffline.current = false;
    };

    const handleOffline = () => {
      setIsOnline(false);
      wasOffline.current = true;
      toast('Offline. Your notes are safe locally.', {
        icon: '雲',
        duration: 4000,
        style: {
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--glass-border)',
        },
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, onReconnect };
}
