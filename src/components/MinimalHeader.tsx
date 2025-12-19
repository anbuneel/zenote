import type { Theme } from '../types';

interface MinimalHeaderProps {
  theme: Theme;
  onThemeToggle: () => void;
  onBack: () => void;
  onSignIn?: () => void;
  isAuthenticated?: boolean;
}

export function MinimalHeader({
  theme,
  onThemeToggle,
  onBack,
  onSignIn,
  isAuthenticated = false,
}: MinimalHeaderProps) {
  return (
    <header
      className="px-6 md:px-8 py-5 flex items-center justify-between shrink-0"
      style={{ borderBottom: '1px solid var(--glass-border)' }}
    >
      {/* Left: Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm transition-colors duration-200"
        style={{
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text-secondary)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
        <span>Back</span>
      </button>

      {/* Right: Theme Toggle + Sign In */}
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={onThemeToggle}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
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
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
