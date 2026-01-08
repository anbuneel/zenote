/**
 * Hook to wrap state changes in View Transitions API for smooth page transitions.
 * Falls back gracefully to instant transitions in unsupported browsers.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */
export function useViewTransition() {
  /**
   * Wraps a callback in a view transition if the browser supports it.
   * In unsupported browsers (e.g., Firefox), the callback runs immediately.
   */
  const startTransition = (callback: () => void) => {
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      callback();
      return;
    }

    // Start view transition with the DOM update callback
    document.startViewTransition(callback);
  };

  return { startTransition };
}
