import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  saveCursorPosition,
  saveScrollPosition,
  saveEditorPosition,
  getEditorPosition,
  clearEditorPosition,
  isScrollPositionFar,
  createThrottledSave,
} from './editorPosition';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

describe('editorPosition', () => {
  beforeEach(() => {
    // Clear mock storage before each test
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveCursorPosition', () => {
    it('saves cursor position to localStorage', () => {
      saveCursorPosition('note-1', { from: 10, to: 20 });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const stored = JSON.parse(mockStorage['yidhan-editor-positions']);
      expect(stored['note-1'].cursor).toEqual({ from: 10, to: 20 });
    });

    it('preserves existing scroll position when saving cursor', () => {
      // First save scroll
      saveScrollPosition('note-1', 500);
      // Then save cursor
      saveCursorPosition('note-1', { from: 10, to: 20 });

      const stored = JSON.parse(mockStorage['yidhan-editor-positions']);
      expect(stored['note-1'].scroll).toBe(500);
      expect(stored['note-1'].cursor).toEqual({ from: 10, to: 20 });
    });
  });

  describe('saveScrollPosition', () => {
    it('saves scroll position to localStorage', () => {
      saveScrollPosition('note-1', 300);

      const stored = JSON.parse(mockStorage['yidhan-editor-positions']);
      expect(stored['note-1'].scroll).toBe(300);
    });

    it('preserves existing cursor position when saving scroll', () => {
      // First save cursor
      saveCursorPosition('note-1', { from: 10, to: 20 });
      // Then save scroll
      saveScrollPosition('note-1', 300);

      const stored = JSON.parse(mockStorage['yidhan-editor-positions']);
      expect(stored['note-1'].cursor).toEqual({ from: 10, to: 20 });
      expect(stored['note-1'].scroll).toBe(300);
    });
  });

  describe('saveEditorPosition', () => {
    it('saves both cursor and scroll together', () => {
      saveEditorPosition('note-1', { from: 5, to: 15 }, 250);

      const stored = JSON.parse(mockStorage['yidhan-editor-positions']);
      expect(stored['note-1'].cursor).toEqual({ from: 5, to: 15 });
      expect(stored['note-1'].scroll).toBe(250);
    });
  });

  describe('getEditorPosition', () => {
    it('returns null when no position is stored', () => {
      const result = getEditorPosition('non-existent');
      expect(result).toBeNull();
    });

    it('returns stored position', () => {
      saveEditorPosition('note-1', { from: 10, to: 20 }, 300);

      const result = getEditorPosition('note-1');
      expect(result).toEqual({
        cursor: { from: 10, to: 20 },
        scroll: 300,
        updatedAt: expect.any(Number),
      });
    });

    it('returns null for expired positions', () => {
      // Save position with old timestamp
      const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000; // 31 days ago
      mockStorage['yidhan-editor-positions'] = JSON.stringify({
        'note-1': {
          cursor: { from: 10, to: 20 },
          scroll: 300,
          updatedAt: oldTimestamp,
        },
      });

      const result = getEditorPosition('note-1');
      expect(result).toBeNull();
    });
  });

  describe('clearEditorPosition', () => {
    it('removes position for a specific note', () => {
      saveEditorPosition('note-1', { from: 10, to: 20 }, 300);
      saveEditorPosition('note-2', { from: 5, to: 5 }, 100);

      clearEditorPosition('note-1');

      expect(getEditorPosition('note-1')).toBeNull();
      expect(getEditorPosition('note-2')).not.toBeNull();
    });
  });

  describe('isScrollPositionFar', () => {
    it('returns false when no position is stored', () => {
      expect(isScrollPositionFar('non-existent')).toBe(false);
    });

    it('returns false when scroll is below threshold', () => {
      saveScrollPosition('note-1', 400);
      expect(isScrollPositionFar('note-1', 500)).toBe(false);
    });

    it('returns true when scroll is above threshold', () => {
      saveScrollPosition('note-1', 600);
      expect(isScrollPositionFar('note-1', 500)).toBe(true);
    });

    it('uses default threshold of 500', () => {
      saveScrollPosition('note-1', 501);
      expect(isScrollPositionFar('note-1')).toBe(true);
    });
  });

  describe('createThrottledSave', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('calls save function immediately on first call', () => {
      const saveFn = vi.fn();
      const throttled = createThrottledSave(saveFn, 1000);

      throttled.save();

      expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('throttles subsequent calls', () => {
      const saveFn = vi.fn();
      const throttled = createThrottledSave(saveFn, 1000);

      throttled.save();
      throttled.save();
      throttled.save();

      expect(saveFn).toHaveBeenCalledTimes(1);

      // Fast-forward 1 second
      vi.advanceTimersByTime(1000);

      expect(saveFn).toHaveBeenCalledTimes(2);
    });

    it('flush() executes pending save immediately', () => {
      const saveFn = vi.fn();
      const throttled = createThrottledSave(saveFn, 1000);

      throttled.save(); // First call - immediate
      throttled.save(); // Second call - pending

      expect(saveFn).toHaveBeenCalledTimes(1);

      throttled.flush();

      expect(saveFn).toHaveBeenCalledTimes(2);
    });

    it('flush() does nothing when no pending save', () => {
      const saveFn = vi.fn();
      const throttled = createThrottledSave(saveFn, 1000);

      throttled.flush();

      expect(saveFn).not.toHaveBeenCalled();
    });

    it('cancel() prevents pending save from executing', () => {
      const saveFn = vi.fn();
      const throttled = createThrottledSave(saveFn, 1000);

      throttled.save(); // First call - immediate
      throttled.save(); // Second call - pending
      throttled.cancel();

      vi.advanceTimersByTime(2000);

      expect(saveFn).toHaveBeenCalledTimes(1);
    });

    it('allows immediate save after delay has passed', () => {
      const saveFn = vi.fn();
      const throttled = createThrottledSave(saveFn, 1000);

      throttled.save();
      expect(saveFn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);

      throttled.save();
      expect(saveFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('storage limits', () => {
    it('limits storage to max entries', () => {
      // Save 105 positions (over the 100 limit)
      // Use different base timestamps to ensure unique updatedAt values
      const baseTime = Date.now();
      vi.spyOn(Date, 'now').mockImplementation(() => baseTime);

      for (let i = 0; i < 105; i++) {
        // Increment mock time for each save to ensure different timestamps
        vi.spyOn(Date, 'now').mockImplementation(() => baseTime + i);
        saveEditorPosition(`note-${i}`, { from: i, to: i }, i * 10);
      }

      vi.restoreAllMocks();

      const stored = JSON.parse(mockStorage['yidhan-editor-positions']);
      const noteCount = Object.keys(stored).length;

      // Should be at most 100 entries
      expect(noteCount).toBeLessThanOrEqual(100);
    });
  });
});
