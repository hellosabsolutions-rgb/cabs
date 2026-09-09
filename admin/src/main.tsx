import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Global Unhandled Error & Promise Rejection Handlers
window.addEventListener('unhandledrejection', (event) => {
  console.warn('⚠️ [Browser] Unhandled Promise Rejection intercepted:', event.reason);
  // Prevent default console explosion if it's already handled
});

window.addEventListener('error', (event) => {
  console.error('🚨 [Browser] Global Uncaught Script Error:', event.error || event.message);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary isRoot fallbackTitle="FleetOS Application Failed to Load">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
