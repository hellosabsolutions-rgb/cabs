import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AgencyProvider } from './context/AgencyContext';
import { FleetProvider } from './context/FleetContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationToast } from './components/common/NotificationToast';
import { ModalAnimationController } from './components/common/ModalAnimationController';
import { MainLayout } from './components/layout/MainLayout';
import './styles/globals.css';

export const App: React.FC = () => {
  console.log("check cicd deploy works or not!");
  return (
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
  );
};

export default App;
