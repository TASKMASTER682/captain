'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { reportError } from '@/lib/errorReporter';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches React render errors, reports them, and shows a recovery screen. */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center font-sans">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
          <h1 className="text-2xl font-bold font-outfit mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm">
            An unexpected error occurred. The issue has been logged automatically. Please refresh to continue.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}