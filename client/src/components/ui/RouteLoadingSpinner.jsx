import React from 'react';
import { Dumbbell } from 'lucide-react';

/**
 * Branded loading spinner fallback rendered inside React Suspense
 * during route lazy-chunk loading.
 *
 * @param {{ fullScreen?: boolean }} props
 * @returns {JSX.Element}
 */
export function RouteLoadingSpinner({ fullScreen = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 ${
        fullScreen ? 'min-h-screen bg-workspace' : 'min-h-[50vh] w-full'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer glowing pulsing ring */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-accent/10 border border-emerald-accent/20 animate-pulse flex items-center justify-center">
          <Dumbbell className="w-7 h-7 text-emerald-accent animate-bounce" />
        </div>
        {/* Rotating border spinner */}
        <div className="absolute inset-0 w-14 h-14 rounded-2xl border-2 border-transparent border-t-emerald-accent animate-spin" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
        Loading GymPilot...
      </p>
    </div>
  );
}

export default RouteLoadingSpinner;
