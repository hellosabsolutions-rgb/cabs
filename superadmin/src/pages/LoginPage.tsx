import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, Sun, Moon, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const DEMO_EMAIL = import.meta.env.VITE_SUPERADMIN_DEMO_EMAIL || '';
const DEMO_PASSWORD = import.meta.env.VITE_SUPERADMIN_DEMO_PASSWORD || '';
const DEMO_ROLE = import.meta.env.VITE_SUPERADMIN_DEMO_ROLE || 'superadmin';
/** Never show seeded credentials in production builds */
const SHOW_DEMO =
  import.meta.env.DEV === true &&
  import.meta.env.MODE === 'development' &&
  Boolean(DEMO_EMAIL && DEMO_PASSWORD);

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();

  const [email, setEmail] = useState(SHOW_DEMO ? DEMO_EMAIL : '');
  const [password, setPassword] = useState(SHOW_DEMO ? DEMO_PASSWORD : '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(email.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Invalid email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        background: 'var(--surface)',
        color: 'var(--text)',
        overflowX: 'hidden',
      }}
    >
      {/* Left — form */}
      <div
        style={{
          flex: '1 1 50%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 5vw 32px',
          background: 'var(--surface)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: theme === 'dark' ? '#14273d' : '#eef6ff',
                border: '1px solid rgba(22, 135, 245, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(22, 135, 245, 0.2)',
                overflow: 'hidden',
                padding: '2px',
              }}
            >
              <img
                src={theme === 'dark' ? '/logo-dark.jpg' : '/logo-light.png'}
                alt="KABPRO"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  letterSpacing: '-0.4px',
                  lineHeight: 1.1,
                }}
              >
                KABPRO
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>
                Superadmin · Internal
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-dim)',
              cursor: 'pointer',
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div style={{ width: '100%', maxWidth: '440px', margin: 'auto', padding: '8px 0' }}>
          <div style={{ marginBottom: '28px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: '999px',
                background: theme === 'dark' ? 'rgba(22,135,245,0.15)' : '#eef6ff',
                color: 'var(--accent)',
                fontSize: '11.5px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              <Shield size={13} />
              Internal team only
            </div>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '-0.6px',
                margin: '0 0 8px',
              }}
            >
              Welcome Back!
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-dim)', lineHeight: 1.5, margin: 0 }}>
              Sign in with your platform superadmin account to manage organizations and projects.
            </p>
          </div>

          {SHOW_DEMO && (
            <div
              style={{
                marginBottom: 20,
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid rgba(22, 135, 245, 0.28)',
                background: theme === 'dark' ? 'rgba(22,135,245,0.12)' : '#eef6ff',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text-dim)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>
                Dev seed login (role: {DEMO_ROLE})
              </div>
              <div>
                Email: <strong style={{ color: 'var(--text)' }}>{DEMO_EMAIL}</strong>
              </div>
              <div>
                Password: <strong style={{ color: 'var(--text)' }}>{DEMO_PASSWORD}</strong>
              </div>
              <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-faint)' }}>
                Seeded from server env · run <code>npm run seed:superadmin</code> in /server
              </div>
            </div>
          )}

          {errorMsg && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid rgba(241, 91, 74, 0.3)',
                padding: '11px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '20px',
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  marginBottom: '7px',
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)',
                  }}
                />
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="you@kabpro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: 46,
                    padding: '0 14px 0 42px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  marginBottom: '7px',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: 46,
                    padding: '0 46px 0 42px',
                    borderRadius: 8,
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                height: 48,
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: 'var(--accent-text)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSubmitting ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isSubmitting ? 0.85 : 1,
                boxShadow: '0 8px 20px rgba(22, 135, 245, 0.28)',
                marginTop: 4,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Signing in…
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        <div
          style={{
            textAlign: 'center',
            padding: '12px 0 0',
            fontSize: '11px',
            color: 'var(--text-faint)',
          }}
        >
          © {new Date().getFullYear()} KABPRO · Internal access only · No public signup
        </div>
      </div>

      {/* Right — brand panel (matches admin) */}
      <div
        className="auth-hero-panel"
        style={{
          flex: '1 1 50%',
          minHeight: '100vh',
          background:
            'radial-gradient(ellipse at 88% 12%, #144273 0%, #092648 38%, #05182f 72%, #030e1c 100%)',
          padding: '64px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          color: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(22, 135, 245, 0.28) 0%, rgba(38, 184, 216, 0.12) 40%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: 520, zIndex: 1 }}>
          <h2
            style={{
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: 1.18,
              letterSpacing: '-0.8px',
              margin: '0 0 18px',
            }}
          >
            Platform control for the KABPRO internal team
          </h2>
          <p
            style={{
              fontSize: '15.5px',
              lineHeight: 1.6,
              color: 'rgba(255,255,255,0.82)',
              margin: 0,
            }}
          >
            Secure console for organizations, projects, and fleet-admin oversight. Access requires a
            platform superadmin account.
          </p>
        </div>
      </div>
    </div>
  );
};
