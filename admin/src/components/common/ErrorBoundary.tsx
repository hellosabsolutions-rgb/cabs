import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, ShieldAlert, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  isRoot?: boolean;
  resetKey?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 [ErrorBoundary Caught]:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Optional dispatch for app toast notification
    try {
      window.dispatchEvent(
        new CustomEvent('fleetos:error', {
          detail: { message: error.message || 'Render error caught by ErrorBoundary' }
        })
      );
    } catch (_) {}
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== undefined && prevProps.resetKey !== this.props.resetKey) {
      if (this.state.hasError) {
        this.handleReset();
      }
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false });
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = `=== FleetOS Error Report ===
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
Message: ${error?.message || 'Unknown error'}
Stack: ${error?.stack || 'No stack'}
Component Stack: ${errorInfo?.componentStack || 'No component stack'}`;

    navigator.clipboard.writeText(errorDetails).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {});
  };

  private handleClearCacheAndReload = () => {
    try {
      // Clear non-critical caches, keeping auth token intact if valid
      const authToken = localStorage.getItem('fleetos_auth_token');
      const refreshToken = localStorage.getItem('fleetos_refresh_token');
      const authUser = localStorage.getItem('fleetos_auth_user');

      sessionStorage.clear();
      
      if (authToken) localStorage.setItem('fleetos_auth_token', authToken);
      if (refreshToken) localStorage.setItem('fleetos_refresh_token', refreshToken);
      if (authUser) localStorage.setItem('fleetos_auth_user', authUser);
    } catch (_) {}

    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      const { isRoot, fallbackTitle } = this.props;
      const { error, copied } = this.state;

      // =========================================================================
      // 1. FULL-SCREEN ROOT ERROR PORTAL
      // =========================================================================
      if (isRoot) {
        return (
          <div
            style={{
              minHeight: '100vh',
              width: '100vw',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at 50% 20%, rgba(255, 92, 92, 0.08) 0%, var(--bg) 80%)',
              color: 'var(--text)',
              padding: '24px',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            <div
              style={{
                maxWidth: '560px',
                width: '100%',
                background: 'var(--surface-1, #12141a)',
                border: '1px solid rgba(255, 92, 92, 0.3)',
                borderRadius: '16px',
                padding: '36px 32px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'rgba(255, 92, 92, 0.15)',
                  border: '1px solid rgba(255, 92, 92, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}
              >
                <ShieldAlert size={32} color="#ff5c5c" />
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
                {fallbackTitle || 'System Encountered an Unexpected Error'}
              </h2>

              <p style={{ fontSize: '13.5px', color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: '22px' }}>
                FleetOS caught an unhandled application error. Your session data is safely preserved. You can refresh or recover by returning to the Dashboard.
              </p>

              {error && (
                <div
                  style={{
                    width: '100%',
                    background: 'var(--surface-2, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    textAlign: 'left',
                    marginBottom: '24px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--danger)', letterSpacing: '0.5px' }}>
                      Diagnostic Trace
                    </span>
                    <button
                      onClick={this.handleCopyError}
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: copied ? 'var(--success)' : 'var(--text-dim)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11.5px',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {copied ? <Check size={12} /> : <Copy size={12} />}
                      {copied ? 'Copied' : 'Copy Log'}
                    </button>
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: 'var(--text-faint)',
                      overflowX: 'auto',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '120px'
                    }}
                  >
                    {error.message || String(error)}
                  </pre>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={this.handleReset}
                  className="btn-primary-action"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    fontSize: '13.5px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={15} /> Recover & Retry
                </button>

                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    fontSize: '13.5px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Home size={15} /> Dashboard Home
                </button>

                <button
                  onClick={this.handleClearCacheAndReload}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    fontSize: '12.5px',
                    color: 'var(--text-faint)',
                    cursor: 'pointer'
                  }}
                  title="Clear temporary session cache and reload fresh"
                >
                  <RotateCcw size={14} /> Clear Cache & Restart
                </button>
              </div>
            </div>
          </div>
        );
      }

      // =========================================================================
      // 2. INLINE COMPONENT / VIEW-LEVEL ERROR BOUNDARY
      // =========================================================================
      return (
        <div
          style={{
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 24px',
            textAlign: 'center',
            background: 'var(--surface-1)',
            border: '1px solid rgba(255, 92, 92, 0.22)',
            borderRadius: '12px',
            margin: '16px 0',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255, 92, 92, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px'
            }}
          >
            <AlertTriangle size={24} color="var(--danger)" />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
            {fallbackTitle || 'Unable to render this module'}
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '440px', lineHeight: 1.5, marginBottom: '18px' }}>
            A rendering issue occurred in this section. The rest of the application remains fully active and operational.
          </p>

          {error && (
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--danger)',
                maxWidth: '520px',
                width: '100%',
                textAlign: 'left',
                marginBottom: '18px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-faint)' }}>Exception</span>
                <button
                  onClick={this.handleCopyError}
                  type="button"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? 'var(--success)' : 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre style={{ marginTop: '4px', whiteSpace: 'pre-wrap', fontSize: '11px', color: 'var(--text-dim)' }}>
                {error.message || String(error)}
              </pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReset}
              className="btn-primary-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              <RefreshCw size={14} /> Retry Section
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
