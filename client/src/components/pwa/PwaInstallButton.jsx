import React from 'react';
import { Download } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa.js';

/**
 * Installation CTA button rendered in navigation headers across all layouts.
 *
 * Appears when the app is installable (Chromium beforeinstallprompt available or iOS device)
 * and not yet running in standalone mode.
 *
 * @param {{ className?: string, compact?: boolean }} props
 * @returns {JSX.Element|null}
 */
export function PwaInstallButton({ className = '', compact = false }) {
  const { isInstallable, installApp } = usePwa();

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={installApp}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-accent/15 text-emerald-accent hover:bg-emerald-accent/25 border border-emerald-accent/30 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-accent shadow-sm ${className}`}
      aria-label="Install GymPilot App"
      title="Install GymPilot as an App"
    >
      <Download className="w-3.5 h-3.5 flex-shrink-0" />
      {!compact && <span className="hidden xs:inline">Install App</span>}
    </button>
  );
}

export default PwaInstallButton;

