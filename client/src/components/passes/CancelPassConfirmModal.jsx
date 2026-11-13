import React, { useEffect, useRef } from "react";
import { formatDate, formatCurrency } from "../../utils/formatters.js";

/**
 * Accessible confirmation dialog for cancelling a queued gym pass.
 *
 * @param {{
 *   pass: Object|null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (passId: number|string) => void,
 *   cancelling?: boolean
 * }} props
 */
export function CancelPassConfirmModal({
  pass,
  isOpen,
  onClose,
  onConfirm,
  cancelling = false,
  error = null,
}) {
  const confirmBtnRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement;
      confirmBtnRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !cancelling) {
          e.preventDefault();
          onClose();
          return;
        }
        if (e.key === "Tab" && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable.length) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        if (
          previouslyFocusedElementRef.current &&
          typeof previouslyFocusedElementRef.current.focus === "function"
        ) {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen, cancelling, onClose]);

  if (!isOpen || !pass) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !cancelling) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative focus:outline-none"
      >
        <div className="flex items-center gap-3 text-rose-400 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-lg font-bold">
            !
          </div>
          <div>
            <h2 id="cancel-dialog-title" className="text-lg font-bold text-zinc-100 font-heading">
              Cancel Queued Pass?
            </h2>
            <p className="text-xs text-zinc-400">This action will cancel your upcoming renewal.</p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
          >
            {typeof error === "string" ? error : error.message || "Failed to cancel pass. Please try again."}
          </div>
        )}

        {/* Pass summary info box */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50 mb-4 text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-400">Membership:</span>
            <span className="font-semibold text-zinc-200">{pass.plan_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Category:</span>
            <span className="text-zinc-300">{pass.category_name || "General"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Scheduled Activation:</span>
            <span className="text-zinc-300">{formatDate(pass.start_date)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-700/50 pt-2">
            <span className="text-zinc-400">Amount Paid:</span>
            <span className="font-semibold text-zinc-100">
              {formatCurrency(pass.price_paid ?? pass.final_amount)}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed mb-6">
          Are you sure you want to cancel this queued pass? It will not activate when your current pass expires.
        </p>

        {/* Dialog Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={cancelling}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Keep Pass
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onConfirm(pass.id)}
            disabled={cancelling}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {cancelling ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Yes, Cancel Pass</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}


