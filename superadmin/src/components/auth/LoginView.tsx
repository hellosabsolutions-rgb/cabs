import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [tab, setTab] = useState<'login' | 'invite'>('login');
  const [email, setEmail] = useState('aarav.mehta@fleetops.in');
  const [password, setPassword] = useState('SuperAdminPassword123');
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (tab === 'login') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please enter both your work email and password.');
        }
        await login({ email: email.trim(), password });
      } else {
        if (!email.trim() || !inviteCode.trim()) {
          throw new Error('Please enter your invitation code and work email.');
        }
        await login({ email: email.trim(), inviteCode: inviteCode.trim() });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setIsLoading(true);
    await login({ email: 'aarav.mehta@fleetops.in', password: 'SuperAdminPassword123' });
    setIsLoading(false);
  };

  return (
    <div className="sa-login-wrap">
      <div className="sa-login-card">
        {/* Brand Header */}
        <div className="sa-login-head">
          <div className="sa-login-brand">
            <Shield size={24} color="#fff" />
          </div>
          <h1 className="sa-login-title">FleetOps Internal Console</h1>
          <p className="sa-login-sub">Authorized internal staff and operations access only</p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '3px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'login' ? 'var(--sa-blue)' : 'transparent',
              color: tab === 'login' ? '#fff' : '#AEB8CC',
              fontSize: '12.5px',
              fontWeight: 700
            }}
            onClick={() => { setTab('login'); setError(null); }}
          >
            Staff Login
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              background: tab === 'invite' ? 'var(--sa-blue)' : 'transparent',
              color: tab === 'invite' ? '#fff' : '#AEB8CC',
              fontSize: '12.5px',
              fontWeight: 700
            }}
            onClick={() => { setTab('invite'); setError(null); }}
          >
            Accept Invitation
          </button>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(228, 87, 46, 0.15)',
              border: '1px solid var(--sa-coral)',
              color: '#FCE7E1',
              padding: '9px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '16px'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="sa-login-form">
          <div>
            <label>Work Email</label>
            <input
              type="email"
              placeholder="name@fleetops.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {tab === 'login' ? (
            <div>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          ) : (
            <div>
              <label>Invitation Code</label>
              <input
                type="text"
                placeholder="INV-TEAM-8891"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="sa-login-btn" disabled={isLoading}>
            {isLoading ? (
              'Authenticating...'
            ) : tab === 'login' ? (
              <>
                Sign in to Console <ArrowRight size={15} />
              </>
            ) : (
              <>
                Accept & Enter <CheckCircle2 size={15} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleQuickDemo}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--sa-blue)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ⚡ Quick Demo Access as Aarav Mehta (Super Admin)
          </button>
        </div>

        <div className="sa-login-foot">
          Protected by FleetOps RBAC & Hardware-Token Audit Protocol
        </div>
      </div>
    </div>
  );
};
