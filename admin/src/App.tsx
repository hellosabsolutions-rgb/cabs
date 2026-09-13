import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { AgencyProvider } from './context/AgencyContext';
import { FleetProvider } from './context/FleetContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationToast } from './components/common/NotificationToast';
import { ModalAnimationController } from './components/common/ModalAnimationController';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MainLayout } from './components/layout/MainLayout';
import { GOOGLE_CLIENT_ID } from './config/env';
import './styles/globals.css';

/** Providers that must always wrap the app (order matters). */
const AppTree: React.FC = () => (
  <BrowserRouter>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AgencyProvider>
            <FleetProvider>
              <NotificationProvider>
                <ErrorBoundary fallbackTitle="KABPRO interface error">
                  <MainLayout />
                </ErrorBoundary>
                <NotificationToast />
                <ModalAnimationController />
              </NotificationProvider>
            </FleetProvider>
          </AgencyProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export const App: React.FC = () => {
  // Google OAuth provider only when client id exists — avoids hard crash
  if (!GOOGLE_CLIENT_ID) {
    return <AppTree />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppTree />
    </GoogleOAuthProvider>
  );
};

export default App;
