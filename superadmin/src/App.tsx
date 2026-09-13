import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { BoardPage } from './pages/BoardPage';

const Root: React.FC = () => {
  const { user } = useAuth();
  return user ? <BoardPage /> : <LoginPage />;
};

export const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
