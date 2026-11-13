import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa.js';

/**
 * Floating update notification prompt.
 *
 * Appears when the Service Worker detects a new version is waiting to activate.
 * Allows the user to immediately update and reload, or dismiss for later.
 *
 * @returns {JSX.Element|null}
 */
export function PwaUpdatePrompt() {
  const { needRefresh, updateApp, dismissUpdate } = usePwa();

  if (!needRefresh) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9990] max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-workspace-card/95 border border-emerald-accent/30 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-slide-in"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 text-emerald-accent flex-shrink-0 mt-0.5">
          <RefreshCw className="w-5 h-5 animate-spin-reverse" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary">
            Update Available
          </h4>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            A new version of GymPilot is ready. Update now for the latest features and optimizations.
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={updateApp}
              className="px-3 py-1.5 rounded-lg bg-emerald-accent text-brand-dark hover:bg-emerald-accent/90 text-xs font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            >
              Update Now
            </button>
            <button
              onClick={dismissUpdate}
              className="px-3 py-1.5 rounded-lg bg-workspace-surface hover:bg-workspace-border text-text-muted hover:text-text-primary text-xs font-medium border border-workspace-border transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            >
              Later
            </button>
          </div>
        </div>

        <button
          onClick={dismissUpdate}
          className="text-text-muted hover:text-text-primary p-1 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent flex-shrink-0"
          aria-label="Dismiss update"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default PwaUpdatePrompt;

