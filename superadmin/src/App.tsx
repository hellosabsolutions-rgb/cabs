import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Console } from './components/Console';
import './styles/superadmin.css';

const SuperAdminApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--sa-ink)',
          color: '#fff',
          fontFamily: 'Manrope, sans-serif'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>FleetOps Console</div>
          <div style={{ fontSize: '13px', color: '#7C8AA8' }}>Verifying internal session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return <Console />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SuperAdminApp />
    </AuthProvider>
  );
};

export default App;
