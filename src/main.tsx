import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ReloadPrompt } from './components/ReloadPrompt'

/**
 * Show a persistent banner prompting user to refresh (for chunk errors outside React)
 * This replaces the hard auto-reload to give users control.
 */
function showUpdateBanner() {
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

// Handle chunk loading errors (happens when app is open during deployment)
// These errors occur outside React's error boundary, so we catch them globally
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason)
  const isChunkError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Loading chunk') ||
    message.includes('Loading CSS chunk') ||
    message.includes('Importing a module script failed')

  if (isChunkError) {
    // Prevent the error from being logged to console (it's expected)
    event.preventDefault()
    // Show banner instead of hard reload - let user decide when to refresh
    showUpdateBanner()
  }
})

// Initialize Sentry for error monitoring (only in production with DSN configured)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask note content in session replays for privacy
        maskAllInputs: true,
        blockAllMedia: false,
        // Block sensitive content selectors
        block: ['.rich-text-editor', '.ProseMirror', '[data-sensitive]'],
      }),
    ],
    // Performance monitoring sample rate (10% of transactions)
    tracesSampleRate: 0.1,
    // Session replay sample rate (10% of sessions, 100% on error)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <ReloadPrompt />
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--glass-border)',
              fontFamily: 'var(--font-body)',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: 'var(--color-accent)',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--color-destructive)',
                secondary: '#fff',
              },
              duration: 5000,
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
