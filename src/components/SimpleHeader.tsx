import type { Theme } from '../types';

interface SimpleHeaderProps {
  theme: Theme;
  onThemeToggle: () => void;
  onLogoClick?: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
}

export function SimpleHeader({
  theme,
  onThemeToggle,
  onLogoClick,
  onSignIn,
  isAuthenticated = false,
}: SimpleHeaderProps) {
  const logoElement = onLogoClick ? (
    <button
      onClick={onLogoClick}
      className="text-xl md:text-[1.75rem] font-semibold tracking-tight transition-colors duration-200 hover:text-[var(--color-accent)]"
      style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.5px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      Zenote
    </button>
  ) : (
    <span
      className="text-xl md:text-[1.75rem] font-semibold tracking-tight"
      style={{
        fontFamily: 'var(--font-display)',
        color: 'var(--color-text-primary)',
        letterSpacing: '-0.5px',
      }}
    >
      Zenote
    </span>
  );

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between shrink-0">
      {/* Logo */}
      {logoElement}

      {/* Right: Theme Toggle + Sign In - consistent positioning */}
      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={onThemeToggle}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-secondary)]"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </button>
        {!isAuthenticated && onSignIn && (
          <button
            onClick={onSignIn}
            className="px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:text-[var(--color-accent)]"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
