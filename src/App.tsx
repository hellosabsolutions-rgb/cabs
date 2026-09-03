import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AgencyProvider } from './context/AgencyContext';
import { FleetProvider } from './context/FleetContext';
import { MainLayout } from './components/layout/MainLayout';
import './styles/globals.css';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AgencyProvider>
          <FleetProvider>
            <MainLayout />
          </FleetProvider>
        </AgencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
