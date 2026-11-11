import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext.jsx';

/**
 * Custom hook to access the global toast notification system.
 * Provides `showToast({ type, message, duration? })` and `dismissToast(id)`.
 *
 * @returns {{ showToast: Function, dismissToast: Function }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default useToast;
