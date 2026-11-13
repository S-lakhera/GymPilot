import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Two-tier React Error Boundary component.
 *
 * Catches unhandled JavaScript exceptions in child component trees, logs the errors,
 * and renders an accessible fallback UI rather than crashing the whole page.
 *
 * Supports two presentation variants:
 * 1. `full`: Full-viewport dark recovery screen for the root application shell.
 * 2. `content`: Compact card-level fallback for isolating errors within page `<main>` content areas.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log unexpected runtime errors for diagnostic audit
    console.error('GymPilot Uncaught Runtime Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error } = this.state;
    const { children, variant = 'full', fallback } = this.props;

    if (!hasError) {
      return children;
    }

    if (typeof fallback === 'function') {
      return fallback({ error, reset: this.handleReset });
    }

    if (fallback) {
      return fallback;
    }

    // Content area isolation variant (used inside layout <main> containers)
    if (variant === 'content') {
      return (
        <div
          role="alert"
          aria-live="assertive"
          className="w-full max-w-2xl mx-auto my-8 p-6 rounded-2xl bg-workspace-card border border-status-danger/30 shadow-lg text-center space-y-4 animate-fade-in"
        >
          <div className="w-12 h-12 rounded-xl bg-status-danger/10 border border-status-danger/20 text-status-danger flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">
              This section encountered an unexpected error
            </h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
              {error?.message || 'An unexpected runtime issue occurred. Navigation and sidebar controls remain active.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-lg bg-emerald-accent text-brand-dark hover:bg-emerald-accent/90 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            >
              Try Again
            </button>
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-workspace-surface hover:bg-workspace-border text-text-muted hover:text-text-primary text-xs font-medium border border-workspace-border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // Full-page application crash variant (used at the root App level)
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-brand-dark text-text-inverted flex items-center justify-center p-4 font-sans"
      >
        <div className="max-w-md w-full p-8 rounded-2xl bg-brand-surface border border-brand-border shadow-2xl text-center space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-status-danger/10 border border-status-danger/20 text-status-danger flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-accent">
              GymPilot System Recovery
            </span>
            <h2 className="text-xl font-bold font-display text-text-inverted">
              Something went wrong
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              An unexpected error interrupted the application. You can reload the app or navigate back to the home view.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-accent text-brand-dark hover:bg-emerald-accent/90 text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Application
            </button>
            <button
              onClick={this.handleGoHome}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-border text-text-muted hover:text-text-inverted text-xs font-medium border border-brand-border transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            >
              <Home className="w-3.5 h-3.5" /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
