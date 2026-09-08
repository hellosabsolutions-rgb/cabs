import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '360px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            textAlign: 'center',
            background: 'var(--surface-1)',
            border: '1px solid rgba(255, 92, 92, 0.25)',
            borderRadius: '12px',
            margin: '20px 0'
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'rgba(255, 92, 92, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}
          >
            <AlertTriangle size={26} color="var(--danger)" />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            {this.props.fallbackTitle || 'Something went wrong rendering this view'}
          </h3>

          <p style={{ fontSize: '13px', color: 'var(--text-dim)', maxWidth: '480px', lineHeight: 1.5, marginBottom: '20px' }}>
            An unexpected error occurred while loading this section. You can try refreshing the component or resetting the view state.
          </p>

          {this.state.error && (
            <details
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--danger)',
                maxWidth: '600px',
                textAlign: 'left',
                marginBottom: '20px',
                cursor: 'pointer'
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Error details</summary>
              <pre style={{ marginTop: '8px', whiteSpace: 'pre-wrap', fontSize: '11px', color: 'var(--text-faint)' }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={this.handleReset}
              className="btn-primary-action"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontSize: '13px' }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
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
