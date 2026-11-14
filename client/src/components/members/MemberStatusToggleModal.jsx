import React, { useEffect, useRef } from "react";
import { useNetworkStatus } from "../../hooks/useNetworkStatus.js";

/**
 * Confirmation dialog for activating or deactivating a member account.
 *
 * @param {{
 *   member: Object|null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (id: number|string, nextState: boolean) => void,
 *   toggling?: boolean
 * }} props
 */
export function MemberStatusToggleModal({
  member,
  isOpen,
  onClose,
  onConfirm,
  toggling = false,
  error = null,
}) {
  const confirmBtnRef = useRef(null);
  const cancelBtnRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);
  const dialogRef = useRef(null);
  const wasOpenRef = useRef(false);
  const { isOnline } = useNetworkStatus();

  // Focus lifecycle: save on open, restore on close
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      previouslyFocusedElementRef.current = document.activeElement;
      if (confirmBtnRef.current && !confirmBtnRef.current.disabled) {
        confirmBtnRef.current.focus();
      } else if (cancelBtnRef.current && !cancelBtnRef.current.disabled) {
        cancelBtnRef.current.focus();
      } else {
        dialogRef.current?.focus();
      }
    }
    wasOpenRef.current = isOpen;

    if (!isOpen && previouslyFocusedElementRef.current) {
      if (typeof previouslyFocusedElementRef.current.focus === "function") {
        previouslyFocusedElementRef.current.focus();
      }
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      if (previouslyFocusedElementRef.current) {
        if (typeof previouslyFocusedElementRef.current.focus === "function") {
          previouslyFocusedElementRef.current.focus();
        }
        previouslyFocusedElementRef.current = null;
      }
    };
  }, []);

  // When toggling or online state changes, maintain focus containment without disrupting user focus
  useEffect(() => {
    if (!isOpen) return;

    if (toggling) {
      dialogRef.current?.focus();
      return;
    }

    const activeEl = document.activeElement;
    const isControlValidInside =
      activeEl &&
      activeEl !== dialogRef.current &&
      dialogRef.current?.contains(activeEl) &&
      !activeEl.disabled;

    // Retain focus if an enabled control inside the dialog already has focus
    if (isControlValidInside) {
      return;
    }

    if (confirmBtnRef.current && !confirmBtnRef.current.disabled) {
      confirmBtnRef.current.focus();
    } else if (cancelBtnRef.current && !cancelBtnRef.current.disabled) {
      cancelBtnRef.current.focus();
    } else {
      dialogRef.current?.focus();
    }
  }, [isOpen, toggling, isOnline]);

  // Keydown listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !toggling) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length || toggling) {
          e.preventDefault();
          dialogRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === dialogRef.current
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            document.activeElement === dialogRef.current
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, toggling, onClose]);

  if (!isOpen || !member) return null;

  const isCurrentlyActive = member.isActive ?? Boolean(member.is_active);
  const nextState = !isCurrentlyActive;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-toggle-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !toggling) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative focus:outline-none"
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-4 ${
            nextState
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {nextState ? "✓" : "!"}
        </div>

        <h2
          id="status-toggle-title"
          className="text-lg font-bold text-zinc-100 font-heading"
        >
          {nextState ? "Reactivate Member Account?" : "Deactivate Member Account?"}
        </h2>

        {error && (
          <div
            role="alert"
            className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
          >
            {typeof error === "string" ? error : error.message || "Failed to update member status."}
          </div>
        )}

        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          {nextState
            ? `Reactivating ${member.first_name || member.firstName}'s account will restore their gym access and allow them to log into GymPilot again.`
            : `Deactivating ${member.first_name || member.firstName}'s account will immediately revoke all active login sessions and block further access until reactivated.`}
        </p>

        {!isOnline && (
          <p className="mt-3 text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            Account status updates require an active internet connection.
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onClose}
            disabled={toggling}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            onClick={() => onConfirm(member.id, nextState)}
            disabled={toggling || !isOnline}
            title={!isOnline ? "Network offline - status updates require an internet connection" : undefined}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              nextState
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-rose-600 hover:bg-rose-500 text-white"
            }`}
          >
            {toggling ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{nextState ? "Yes, Reactivate" : "Yes, Deactivate"}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

