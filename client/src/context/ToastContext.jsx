import React, { createContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * @typedef {'success'|'warning'|'danger'|'info'} ToastType
 */

/**
 * @typedef {Object} Toast
 * @property {string} id - Unique identifier
 * @property {ToastType} type - Toast variant
 * @property {string} message - Display message
 * @property {number} duration - Auto-dismiss duration in milliseconds
 */

export const ToastContext = createContext(null);

/** Auto-incrementing toast ID counter. */
let toastIdCounter = 0;

/** Default auto-dismiss duration in milliseconds. */
const DEFAULT_DURATION = 4000;

/**
 * Style tokens and icon mappings for each toast variant.
 */
const TOAST_VARIANTS = {
  success: {
    container: 'bg-status-success/10 border-status-success/30 text-status-success',
    icon: CheckCircle2,
  },
  warning: {
    container: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
    icon: AlertTriangle,
  },
  danger: {
    container: 'bg-status-danger/10 border-status-danger/30 text-status-danger',
    icon: AlertCircle,
  },
  info: {
    container: 'bg-status-info/10 border-status-info/30 text-status-info',
    icon: Info,
  },
};

/**
 * Individual toast notification component.
 *
 * @param {{ toast: Toast, onDismiss: (id: string) => void }} props
 * @returns {JSX.Element}
 */
function ToastItem({ toast, onDismiss }) {
  const variant = TOAST_VARIANTS[toast.type] || TOAST_VARIANTS.info;
  const Icon = variant.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm w-full animate-slide-in ${variant.container}`}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <p className="text-sm font-medium flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Application-wide Toast notification provider.
 * Exposes `showToast({ type, message, duration? })` to trigger floating auto-dismissing notifications.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Displays a new toast notification.
   *
   * @param {{ type: ToastType, message: string, duration?: number }} options
   */
  const showToast = useCallback(({ type = 'info', message, duration = DEFAULT_DURATION }) => {
    const id = `toast-${++toastIdCounter}`;
    const newToast = { id, type, message, duration };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  /**
   * Manually dismisses a toast by its ID.
   *
   * @param {string} id - Toast identifier
   */
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Floating Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed z-[9999] bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col-reverse gap-3 pointer-events-auto">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export default ToastProvider;
