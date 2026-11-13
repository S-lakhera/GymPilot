import { useState, useEffect, useContext, useRef } from 'react';
import { ToastContext } from '../context/ToastContext.jsx';

/**
 * Custom hook to monitor device network connectivity status.
 *
 * NOTE: navigator.onLine is treated as an advisory connectivity indicator,
 * not proof of backend availability. True availability is confirmed on API response.
 *
 * Automatically displays a success toast when recovering from an offline state.
 *
 * @returns {{ isOnline: boolean, wasOffline: boolean }}
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const toastContext = useContext(ToastContext);
  const toastRef = useRef(toastContext);
  toastRef.current = toastContext;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline((prev) => {
        if (prev && toastRef.current?.showToast) {
          toastRef.current.showToast({
            type: 'success',
            message: 'You are back online. Reconnecting to services...',
          });
        }
        return false;
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, wasOffline };
}

export default useNetworkStatus;

