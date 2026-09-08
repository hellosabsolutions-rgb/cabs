import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const { theme, setTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const triggerGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setErrorMsg('');
      setIsGoogleLoading(true);
      try {
        const res = await googleLogin({ accessToken: tokenResponse.access_token }, rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || 'Google Sign-in failed.');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Google Sign-in failed.');
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.warn('Google sign-in error:', errorResponse);
      setIsGoogleLoading(false);
      setErrorMsg('Google Sign-in was cancelled or failed. Please try again.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await login(email.trim(), password, rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        }
      } else {
        const res = await register(name.trim(), email.trim(), password, phone.trim(), rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Password reset instructions: Please contact your system administrator to reset your account password.');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontFamily: "'Poppins', sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* ──────────────── LEFT PANEL: LOGIN / SIGNUP FORM ──────────────── */}
      <div
        style={{
          flex: '1 1 50%',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '40px 5vw 32px',
          background: 'var(--surface)',
          overflowY: 'auto'
        }}
      >
        {/* Top Header Row: Logo & Theme Switcher */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '480px',
            margin: '0 auto 24px'
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
                padding: '2px'
              }}
            >
              <img
                src={theme === 'dark' ? '/logo-dark.jpg' : '/logo-light.png'}
                alt="KABPRO Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                onError={(e) => {
                  (e.currentTarget.parentNode as HTMLElement).innerHTML = `
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="16 18 22 12 16 6"></polyline>
                      <polyline points="8 6 2 12 8 18"></polyline>
                    </svg>
                  `;
                }}
              />
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.4px',
                color: 'var(--text)'
              }}
            >
              KABPRO
            </span>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
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
              transition: 'all 0.15s ease'
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Center Main Form */}
        <div
          style={{
            width: '100%',
            maxWidth: '440px',
            margin: 'auto',
            padding: '8px 0'
          }}
        >
          {/* Welcome Title & Subtitle */}
          <div style={{ marginBottom: '28px' }}>
            <h1
              style={{
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '-0.6px',
                color: 'var(--text)',
                margin: '0 0 8px'
              }}
            >
              {mode === 'login' ? 'Welcome Back!' : 'Create Account'}
            </h1>
            <p
              style={{
                fontSize: '13.5px',
                color: 'var(--text-dim)',
                lineHeight: 1.5,
                margin: 0
              }}
            >
              {mode === 'login'
                ? 'Sign in to access your dashboard and continue managing your fleet operations.'
                : 'Sign up to manage your vehicles, drivers, bookings, and compliance schedules.'}
            </p>
          </div>

          {/* Error Message */}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {mode === 'register' && (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      marginBottom: '7px',
                      color: 'var(--text)'
                    }}
                  >
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-faint)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 42px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={e => {
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
                      color: 'var(--text)'
                    }}
                  >
                    Phone Number (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone
                      size={17}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-faint)'
                      }}
                    />
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 14px 0 42px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '13.5px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                      }}
                      onFocus={e => {
                        e.target.style.borderColor = 'var(--accent)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.15)';
                      }}
                      onBlur={e => {
                        e.target.style.borderColor = 'var(--border)';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </>
            )}


            {/* Email Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  marginBottom: '7px',
                  color: 'var(--text)'
                }}
              >
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)'
                  }}
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 14px 0 42px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.18)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 500,
                  marginBottom: '7px',
                  color: 'var(--text)'
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={17}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-faint)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '46px',
                    padding: '0 44px 0 42px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '13.5px',
                    outline: 'none',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--accent)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(22, 135, 245, 0.18)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Sub-row: Remember Me & Forgot Password */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '-2px'
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: '12.5px',
                  color: 'var(--text-dim)'
                }}
              >
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{
                    width: '15px',
                    height: '15px',
                    accentColor: 'var(--accent)',
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                />
                <span>Remember this device</span>
              </label>

              {mode === 'login' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent)',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '6px',
                boxShadow: '0 4px 16px rgba(22, 135, 245, 0.35)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => {
                if (!isSubmitting) (e.currentTarget.style.background = '#1174d8');
              }}
              onMouseLeave={e => {
                if (!isSubmitting) (e.currentTarget.style.background = 'var(--accent)');
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-loader" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating Account...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '14px 0 12px',
                gap: '12px'
              }}
            >
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: 'var(--text-faint)'
                }}
              >
                or continue with
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            {/* Custom Theme-matched Google Sign-in / Sign-up Button */}
            <button
              type="button"
              id="custom-google-auth-btn"
              onClick={() => {
                setErrorMsg('');
                triggerGoogleAuth();
              }}
              disabled={isSubmitting || isGoogleLoading}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '8px',
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                cursor: isSubmitting || isGoogleLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                boxShadow: theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.04)',
                userSelect: 'none'
              }}
              onMouseEnter={e => {
                if (!isSubmitting && !isGoogleLoading) {
                  e.currentTarget.style.borderColor = 'rgba(22, 135, 245, 0.6)';
                  e.currentTarget.style.background = 'var(--surface-3)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(22, 135, 245, 0.15)';
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting && !isGoogleLoading) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'var(--surface-2)';
                  e.currentTarget.style.boxShadow = theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 6px rgba(0, 0, 0, 0.04)';
                }
              }}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={18} className="spin-loader" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  {/* Official Google 'G' Logo SVG */}
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </>
              )}
            </button>
          </form>

          {/* Bottom Switcher */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '24px',
              fontSize: '13px',
              color: 'var(--text-dim)'
            }}
          >
            {mode === 'login' ? (
              <>
                Don&apos;t have an Account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an Account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom copyright spacer */}
        <div style={{ textAlign: 'center', padding: '12px 0 0', fontSize: '11px', color: 'var(--text-faint)' }}>
          © {new Date().getFullYear()} KABPRO Logistics & Fleet Management OS
        </div>
      </div>

      {/* ──────────────── RIGHT PANEL: BRAND HERO & TESTIMONIAL ──────────────── */}
      <div
        className="auth-hero-panel"
        style={{
          flex: '1 1 50%',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at 88% 12%, #144273 0%, #092648 38%, #05182f 72%, #030e1c 100%)',
          padding: '64px 60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          color: '#ffffff',
          overflow: 'hidden'
        }}
      >
        {/* Soft decorative glow */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22, 135, 245, 0.28) 0%, rgba(38, 184, 216, 0.12) 40%, rgba(0, 0, 0, 0) 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Top Spacer */}
        <div style={{ height: '20px' }} />

        {/* Middle Hero Section */}
        <div style={{ maxWidth: '560px', zIndex: 1 }}>
          {/* Main Headline */}
          <h2
            style={{
              fontSize: '44px',
              fontWeight: 700,
              lineHeight: 1.16,
              letterSpacing: '-0.8px',
              color: '#ffffff',
              margin: '0 0 34px'
            }}
          >
            Revolutionize Fleet Operations with Smarter Automation
          </h2>

          {/* Quotation Mark SVG */}
          <div style={{ marginBottom: '14px' }}>
            <svg width="34" height="28" viewBox="0 0 34 28" fill="none">
              <path
                d="M9.8 0C4.38667 0 0 4.48 0 10C0 19.32 7.70667 25.48 13.6 28L15.3 24.36C10.7667 22.4 7.48 18.62 7.02667 14H10.2C13.4867 14 16.15 11.34 16.15 8C16.15 3.58 13.3167 0 9.8 0ZM27.45 0C22.0367 0 17.65 4.48 17.65 10C17.65 19.32 25.3567 25.48 31.25 28L32.95 24.36C28.4167 22.4 25.13 18.62 24.6767 14H27.85C31.1367 14 33.8 11.34 33.8 8C33.8 3.58 30.9667 0 27.45 0Z"
                fill="#26b8d8"
              />
            </svg>
          </div>

          {/* Testimonial Quote */}
          <p
            style={{
              fontSize: '17px',
              lineHeight: 1.6,
              color: 'rgba(255, 255, 255, 0.88)',
              fontWeight: 400,
              margin: '0 0 32px'
            }}
          >
            &ldquo;KABPRO has completely transformed our fleet operations and dispatch.
            It&apos;s reliable, ultra-efficient, and ensures our commercial logistics and compliance
            are always top-notch.&rdquo;
          </p>

          {/* Author Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(38, 184, 216, 0.4)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                flexShrink: 0
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80"
                alt="Akash Kumar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#ffffff' }}>
                Akash Kumar
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '2px' }}>
                Software Developer at Opsiva
              </div>
            </div>
          </div>
        </div>


        {/* Bottom Client Logos Row */}
        <div style={{ marginTop: '48px', zIndex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '22px'
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '1px',
                color: 'rgba(255, 255, 255, 0.55)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              JOIN 1K TEAMS
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.15)' }} />
          </div>

          {/* Logos Grid (2 rows matching the reference image) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              rowGap: '20px',
              columnGap: '24px',
              alignItems: 'center'
            }}
          >
            {/* Discord */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
              <svg width="22" height="17" viewBox="0 0 24 18" fill="currentColor">
                <path d="M20.317 1.492A19.78 19.78 0 0015.558.01a.077.077 0 00-.041.037c-.211.375-.444.864-.608 1.25a18.27 18.27 0 00-5.818 0 12.06 12.06 0 00-.617-1.25.077.077 0 00-.041-.037A19.736 19.736 0 003.677 1.492a.07.07 0 00-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 12.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '-0.3px' }}>Discord</span>
            </div>

            {/* Mailchimp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 12.5a3.5 3.5 0 01-7 0 .5.5 0 011 0 2.5 2.5 0 005 0 .5.5 0 011 0zm-.5-5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-6 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>mailchimp</span>
            </div>

            {/* Grammarly */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: '2px solid currentColor',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                G
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>grammarly</span>
            </div>

            {/* Attentive */}
            <div style={{ opacity: 0.75 }}>
              <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                attentive<span style={{ fontSize: '10px' }}>®</span>
              </span>
            </div>

            {/* HelloSign */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.75 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 2 22 22 22"></polygon>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px' }}>HELLOSIGN</span>
            </div>

            {/* Intercom */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                <line x1="7" y1="9" x2="7" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="10.5" y1="7.5" x2="10.5" y2="16.5" stroke="currentColor" strokeWidth="2"/>
                <line x1="14" y1="7.5" x2="14" y2="16.5" stroke="currentColor" strokeWidth="2"/>
                <line x1="17" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.6px' }}>INTERCOM</span>
            </div>

            {/* Square */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '3px',
                  border: '2px solid currentColor',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <div style={{ width: 6, height: 6, background: 'currentColor', borderRadius: '1px' }} />
              </div>
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Square</span>
            </div>

            {/* Dropbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.75 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 2l6 4-6 4-6-4 6-4zm12 0l6 4-6 4-6-4 6-4zM0 14l6-4 6 4-6 4-6-4zm24 0l-6-4-6 4 6 4 6-4zM6 19.5l6-4 6 4-6 4-6-4z"/>
              </svg>
              <span style={{ fontSize: '13.5px', fontWeight: 700 }}>Dropbox</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
