import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AgencyProvider } from './context/AgencyContext';
import { FleetProvider } from './context/FleetContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationToast } from './components/common/NotificationToast';
import { ModalAnimationController } from './components/common/ModalAnimationController';
import { MainLayout } from './components/layout/MainLayout';
import './styles/globals.css';

const GOOGLE_CLIENT_ID = '546992458715-dbhmfbb7bj36h6sfm2m4l8qjisdmd491.apps.googleusercontent.com';

export const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AgencyProvider>
              <FleetProvider>
                <NotificationProvider>
                  <MainLayout />
                  <NotificationToast />
                  <ModalAnimationController />
                </NotificationProvider>
              </FleetProvider>
            </AgencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};

export default App;
