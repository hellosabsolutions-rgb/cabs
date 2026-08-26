import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FleetProvider } from './context/FleetContext';
import { MainLayout } from './components/layout/MainLayout';
import './styles/globals.css';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <FleetProvider>
        <MainLayout />
      </FleetProvider>
    </ThemeProvider>
  );
};

export default App;
