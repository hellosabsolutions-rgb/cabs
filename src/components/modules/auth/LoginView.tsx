import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNotifications } from '../../../context/NotificationContext';
import { isPushSupported, promptNotificationPermission } from '../../../services/pushNotificationService';
import {
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  Loader2,
  Sun,
  Moon,
  MapPin,
  ClipboardCheck,
  Navigation
} from 'lucide-react';

const GoogleMark = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
);

export const LoginView: React.FC = () => {
  const { login, register, googleLogin } = useAuth();
  const { enablePush } = useNotifications();
  const { theme, setTheme } = useTheme();

  const askNotificationPermission = () => {
    if (isPushSupported()) {
      void promptNotificationPermission();
    }
  };

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
        } else {
          void enablePush();
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
    askNotificationPermission();
    try {
      if (mode === 'login') {
        const res = await login(email.trim(), password, rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || 'Invalid email or password.');
        } else {
          void enablePush();
        }
      } else {
        const res = await register(name.trim(), email.trim(), password, phone.trim(), rememberMe);
        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create account.');
        } else {
          void enablePush();
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
    <div className="auth-screen">
      <div className="auth-form-panel">
        <div className="auth-form-header">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <img src="/kabpro.png?v=2" alt="KABPRO Logo" />
            </div>
            <span className="auth-brand-name">KABPRO</span>
          </div>

          <button
            type="button"
            className="auth-theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="auth-form-body">
          <h1 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'login'
              ? 'Sign in to manage vehicles, drivers, and dispatch.'
              : 'Set up your workspace for vehicles, drivers, and bookings.'}
          </p>

          {errorMsg && (
            <div className="auth-error" role="alert">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <>
                <div>
                  <label className="auth-label" htmlFor="auth-name">Full Name</label>
                  <div className="auth-field">
                    <User size={17} className="auth-field-icon" />
                    <input
                      id="auth-name"
                      type="text"
                      className="auth-input"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div>
                  <label className="auth-label" htmlFor="auth-phone">Phone Number (Optional)</label>
                  <div className="auth-field">
                    <Phone size={17} className="auth-field-icon" />
                    <input
                      id="auth-phone"
                      type="tel"
                      className="auth-input"
                      placeholder="Enter phone number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="auth-label" htmlFor="auth-email">Email</label>
              <div className="auth-field">
                <Mail size={17} className="auth-field-icon" />
                <input
                  id="auth-email"
                  type="email"
                  className="auth-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="auth-label" htmlFor="auth-password">Password</label>
              <div className="auth-field">
                <Lock size={17} className="auth-field-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input auth-input-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="auth-row">
              <label className="auth-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span>Remember this device</span>
              </label>

              {mode === 'login' && (
                <button type="button" className="auth-link" onClick={handleForgotPassword}>
                  Forgot Password?
                </button>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="spin-loader" />
                  <span>{mode === 'login' ? 'Signing in...' : 'Creating Account...'}</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>

            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or continue with</span>
              <div className="auth-divider-line" />
            </div>

            <button
              type="button"
              id="custom-google-auth-btn"
              className="auth-google"
              onClick={() => {
                setErrorMsg('');
                askNotificationPermission();
                triggerGoogleAuth();
              }}
              disabled={isSubmitting || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 size={18} className="spin-loader" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <GoogleMark />
                  <span>{mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? (
              <>
                Don&apos;t have an Account?{' '}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
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
                  className="auth-link"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>

        <div className="auth-copyright">
          © {new Date().getFullYear()} KABPRO Logistics & Fleet Management OS
        </div>
      </div>

      <div className="auth-hero-panel">
        <div className="auth-hero-glow" />

        <div className="auth-hero-inner">
          <h2 className="auth-hero-title">
            Fleet operations that stay on schedule
          </h2>
          <p className="auth-hero-lead">
            Track vehicles, log duty, and dispatch trips from one desk.
          </p>

          <svg className="auth-quote-mark" width="28" height="22" viewBox="0 0 34 28" fill="none" aria-hidden="true">
            <path
              d="M9.8 0C4.38667 0 0 4.48 0 10C0 19.32 7.70667 25.48 13.6 28L15.3 24.36C10.7667 22.4 7.48 18.62 7.02667 14H10.2C13.4867 14 16.15 11.34 16.15 8C16.15 3.58 13.3167 0 9.8 0ZM27.45 0C22.0367 0 17.65 4.48 17.65 10C17.65 19.32 25.3567 25.48 31.25 28L32.95 24.36C28.4167 22.4 25.13 18.62 24.6767 14H27.85C31.1367 14 33.8 11.34 33.8 8C33.8 3.58 30.9667 0 27.45 0Z"
              fill="currentColor"
            />
          </svg>
          <p className="auth-quote">
            &ldquo;KABPRO keeps our dispatch reliable and our compliance on track.
            Fleet ops finally feel under control.&rdquo;
          </p>

          <div className="auth-author">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=140&auto=format&fit=crop&q=80"
              alt=""
            />
            <div>
              <div className="auth-author-name">Akash Kumar</div>
              <div className="auth-author-role">Software Developer at Opsiva</div>
            </div>
          </div>

          <div className="auth-caps">
            <div className="auth-cap">
              <MapPin size={15} />
              Live tracking
            </div>
            <div className="auth-cap">
              <ClipboardCheck size={15} />
              Duty logs
            </div>
            <div className="auth-cap">
              <Navigation size={15} />
              Dispatch
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
