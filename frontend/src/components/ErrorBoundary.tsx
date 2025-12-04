import React, { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles.errorContainer}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
          <h2 className={styles.title}>Something went wrong</h2>
          <p className={styles.message}>
            We're sorry, but something unexpected happened. Please try
            refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={styles.actionButton}
          >
            Refresh Page
          </button>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <div className={styles.developerInfo}>
              <details>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Error Details (Development Only)
                </summary>
                <pre className={styles.details}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
