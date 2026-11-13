import React, { useEffect, useRef } from "react";

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
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !toggling) onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
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
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
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

        <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
          {nextState
            ? `Reactivating ${member.first_name || member.firstName}'s account will restore their gym access and allow them to log into GymPilot again.`
            : `Deactivating ${member.first_name || member.firstName}'s account will immediately revoke all active login sessions and block further access until reactivated.`}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
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
            disabled={toggling}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 ${
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

