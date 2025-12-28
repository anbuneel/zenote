/**
 * Retry utility with exponential backoff
 *
 * Retries a failed async operation with increasing delays between attempts.
 * Default: 3 attempts with delays of 1s, 2s, 4s (exponential backoff)
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Optional callback on each retry attempt */
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Wraps an async function with retry logic
 *
 * @param fn - Async function to retry on failure
 * @param options - Retry configuration
 * @returns Result of the function if successful
 * @throws Last error if all retries fail
 *
 * @example
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxAttempts: 3, onRetry: (n) => console.log(`Retry ${n}`) }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    backoffMultiplier,
  } = { ...DEFAULT_OPTIONS, ...options };
  const { onRetry } = options;

  let lastError: Error = new Error('Unknown error');
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next retry (exponential backoff)
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Promise-based sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
