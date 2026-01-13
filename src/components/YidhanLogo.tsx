/**
 * Yidhan Logo Component
 *
 * The logo mark represents:
 * - Arc: Spring (Ishya) - new beginnings, growth, renewal
 * - Dot: Bright (Idhanth) - clarity, illumination, insight
 *
 * Together: "Where ideas bloom with clarity"
 */

interface YidhanLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  onClick?: () => void;
  className?: string;
}

export function YidhanLogo({
  size = 'md',
  showWordmark = true,
  onClick,
  className = '',
}: YidhanLogoProps) {
  // Size configurations
  const sizes = {
    sm: { mark: 24, text: '1.1rem', gap: 6 },
    md: { mark: 32, text: '1.4rem', gap: 8 },
    lg: { mark: 40, text: '1.75rem', gap: 10 },
  };

  const { mark: markSize, text: textSize, gap } = sizes[size];

  const content = (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {/* Logo Mark - Arc + Dot */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Arc - brush stroke style */}
        <path
          d="M15 55 C15 25, 50 5, 85 55"
          stroke="var(--color-accent)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          style={{ opacity: 0.95 }}
        />
        {/* Secondary arc line for brush texture */}
        <path
          d="M20 52 C22 30, 55 15, 80 52"
          stroke="var(--color-accent)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          style={{ opacity: 0.4 }}
        />
        {/* Dot - golden seed/sun (uses status-progress which is gold in both themes) */}
        <circle
          cx="50"
          cy="70"
          r="10"
          fill="var(--color-status-progress)"
          style={{ opacity: 0.95 }}
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: textSize,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'var(--color-text-primary)',
          }}
        >
          Yidhan
        </span>
      )}
    </span>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="transition-opacity duration-200 hover:opacity-80"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-label="Go to home"
      >
        {content}
      </button>
    );
  }

  return content;
}
