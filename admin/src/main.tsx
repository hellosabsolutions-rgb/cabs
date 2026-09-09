import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';

declare global {
  interface Window {
    __kabproHideBoot?: () => void;
  }
}

window.addEventListener('unhandledrejection', (event) => {
  console.warn('⚠️ [Browser] Unhandled Promise Rejection intercepted:', event.reason);
});

window.addEventListener('error', (event) => {
  console.error('🚨 [Browser] Global Uncaught Script Error:', event.error || event.message);
});

function hideBootShell() {
  try {
    window.__kabproHideBoot?.();
  } catch {
    /* ignore */
  }
}

const rootEl = document.getElementById('root');

if (!rootEl) {
  console.error('KABPRO: #root element missing');
} else {
  try {
    const root = ReactDOM.createRoot(rootEl);
    root.render(
      <React.StrictMode>
        <ErrorBoundary isRoot fallbackTitle="KABPRO failed to load">
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    // Hide HTML boot shell once React has scheduled first paint
    requestAnimationFrame(() => {
      hideBootShell();
      setTimeout(hideBootShell, 50);
    });
  } catch (err) {
    console.error('KABPRO boot crash:', err);
    // Leave #boot-fallback visible with reload button (index.html handler)
  }
}
