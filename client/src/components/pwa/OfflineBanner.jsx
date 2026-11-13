import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus.js';

/**
 * Sticky top banner alerting users when network connectivity is lost.
 *
 * Explains that GymPilot is operating in offline cached mode and that
 * financial mutations (purchases, renewals, refunds, check-ins) are paused
 * until network connectivity is re-established.
 *
 * @returns {JSX.Element|null}
 */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-950/80 border-b border-amber-500/30 text-amber-200 px-4 py-2.5 text-xs sm:text-sm font-medium backdrop-blur-md sticky top-0 z-[60] flex items-center justify-center gap-2.5 shadow-md"
    >
      <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />
      <span className="text-center">
        <strong className="font-semibold text-amber-300">Offline Mode:</strong> Cached pages and data are available. Financial transactions, check-ins, and mutations are paused until reconnected.
      </span>
    </div>
  );
}

export default OfflineBanner;

