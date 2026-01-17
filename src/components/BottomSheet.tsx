import { useRef, useEffect, type ReactNode } from 'react';
import { useDrag } from '@use-gesture/react';
import { useSpring, animated, config } from '@react-spring/web';
import { useMobileDetect } from '../hooks/useMobileDetect';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Title shown in the sheet header */
  title?: string;
  /** Maximum height as percentage of viewport (default: 90) */
  maxHeightPercent?: number;
  /** Whether to show the drag handle (default: true on mobile) */
  showHandle?: boolean;
  /** Additional class names for the content container */
  className?: string;
}

// Drag thresholds
const DISMISS_THRESHOLD = 100; // px to drag down to dismiss
const VELOCITY_THRESHOLD = 0.5; // velocity to dismiss regardless of distance

/**
 * iOS-style bottom sheet modal.
 *
 * On mobile: Slides up from bottom, drag down to dismiss
 * On desktop: Falls back to centered modal behavior
 *
 * Uses react-spring for physics-based animations matching
 * the swipe gesture feel elsewhere in the app.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  maxHeightPercent = 90,
  showHandle = true,
  className = '',
}: BottomSheetProps) {
  const isMobile = useMobileDetect();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Spring for sheet position (0 = fully open, positive = dragging down)
  const [{ y }, api] = useSpring(() => ({
    y: window.innerHeight, // Start off-screen
    config: config.stiff,
  }));

  // Spring for backdrop opacity
  const [{ backdropOpacity }, backdropApi] = useSpring(() => ({
    backdropOpacity: 0,
    config: config.default,
  }));

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      api.start({ y: 0 });
      backdropApi.start({ backdropOpacity: 1 });
    } else {
      api.start({ y: window.innerHeight });
      backdropApi.start({ backdropOpacity: 0 });
    }
  }, [isOpen, api, backdropApi]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Drag to dismiss gesture (mobile only)
  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], down, cancel }) => {
      // Only allow dragging down
      if (my < 0) {
        api.start({ y: 0, immediate: true });
        return;
      }

      if (down) {
        // While dragging, follow finger
        api.start({ y: my, immediate: true });
      } else {
        // On release, check if should dismiss
        const shouldDismiss =
          my > DISMISS_THRESHOLD || (vy > VELOCITY_THRESHOLD && my > 30);

        if (shouldDismiss) {
          // Dismiss
          api.start({
            y: window.innerHeight,
            config: { ...config.stiff, velocity: vy },
          });
          backdropApi.start({ backdropOpacity: 0 });
          // Wait for animation then close
          setTimeout(onClose, 200);
          cancel();
        } else {
          // Snap back
          api.start({ y: 0 });
        }
      }
    },
    {
      from: () => [0, y.get()],
      filterTaps: true,
      bounds: { top: 0 },
      rubberband: true,
      enabled: isMobile,
    }
  );

  if (!isOpen && y.get() >= window.innerHeight) {
    return null;
  }

  // Desktop fallback: centered modal
  if (!isMobile) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onClose}
      >
        <div
          className={`
            w-full max-w-md mx-4 max-h-[85vh] overflow-hidden
            rounded-2xl shadow-2xl
            ${className}
          `}
          style={{
            background: 'var(--color-bg-primary)',
            animation: 'modal-enter 0.3s var(--spring-bounce) forwards',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <h2
                className="text-lg font-medium text-center"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {title}
              </h2>
            </div>
          )}
          <div className="overflow-y-auto max-h-[calc(85vh-60px)]">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Mobile: bottom sheet
  return (
    <>
      {/* Backdrop */}
      <animated.div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: backdropOpacity,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <animated.div
        ref={sheetRef}
        {...bind()}
        className={`
          fixed left-0 right-0 bottom-0 z-50
          rounded-t-3xl shadow-2xl overflow-hidden
          touch-none
          ${className}
        `}
        style={{
          y,
          maxHeight: `${maxHeightPercent}vh`,
          background: 'var(--color-bg-primary)',
          // Safe area padding for iPhone home indicator
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--color-bg-tertiary)' }}
            />
          </div>
        )}

        {/* Title */}
        {title && (
          <div
            className="px-6 pb-3 border-b"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <h2
              className="text-lg font-medium text-center"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: `calc(${maxHeightPercent}vh - ${title ? '80px' : '40px'} - env(safe-area-inset-bottom))`,
          }}
        >
          {children}
        </div>
      </animated.div>
    </>
  );
}
