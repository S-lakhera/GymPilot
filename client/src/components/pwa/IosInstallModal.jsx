import React, { useEffect, useRef } from 'react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePwa } from '../../hooks/usePwa.js';

/**
 * Accessible modal providing step-by-step instructions for installing
 * GymPilot on iOS Safari / iPadOS devices.
 *
 * @returns {JSX.Element|null}
 */
export function IosInstallModal() {
  const { showIosModal, setShowIosModal } = usePwa();
  const dialogRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // Focus management and Escape key dismissal
  useEffect(() => {
    if (!showIosModal) {
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
        previouslyFocusedElementRef.current = null;
      }
      return;
    }

    previouslyFocusedElementRef.current = document.activeElement;
    dialogRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowIosModal(false);
        return;
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusableElements = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter(
          (el) => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden')
        );

        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === dialogRef.current) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showIosModal, setShowIosModal]);

  if (!showIosModal) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowIosModal(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        tabIndex={-1}
        className="w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto bg-workspace-card border border-workspace-border rounded-2xl p-6 shadow-2xl focus:outline-none"
      >
        <div className="flex items-center justify-between pb-4 border-b border-workspace-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-accent/10 border border-emerald-accent/20 flex items-center justify-center text-emerald-accent">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 id="ios-install-title" className="text-base font-bold text-text-primary">
                Install GymPilot on iOS
              </h3>
              <p className="text-xs text-text-secondary">Quick setup for Safari on iPhone & iPad</p>
            </div>
          </div>
          <button
            onClick={() => setShowIosModal(false)}
            className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-workspace-surface transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent"
            aria-label="Close installation guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-bold text-emerald-accent flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1 text-sm text-text-secondary leading-relaxed">
              Open GymPilot in <strong className="text-text-primary">Safari</strong> and tap the{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-text-primary bg-workspace-surface px-1.5 py-0.5 rounded border border-workspace-border">
                <Share className="w-3.5 h-3.5 text-emerald-accent inline" /> Share
              </span>{' '}
              button at the bottom of the screen.
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-bold text-emerald-accent flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1 text-sm text-text-secondary leading-relaxed">
              Scroll down the menu and tap{' '}
              <span className="inline-flex items-center gap-1 font-semibold text-text-primary bg-workspace-surface px-1.5 py-0.5 rounded border border-workspace-border">
                <PlusSquare className="w-3.5 h-3.5 text-emerald-accent inline" /> Add to Home Screen
              </span>
              .
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-7 h-7 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-bold text-emerald-accent flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="flex-1 text-sm text-text-secondary leading-relaxed">
              Tap <strong className="text-text-primary">Add</strong> in the top-right corner to launch GymPilot anytime in full-screen standalone mode.
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-workspace-border flex justify-end">
          <button
            onClick={() => setShowIosModal(false)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-accent text-brand-dark hover:bg-emerald-accent/90 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-accent"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

export default IosInstallModal;

