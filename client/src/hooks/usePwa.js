import { useContext } from 'react';
import { PwaContext } from '../context/PwaContext.jsx';

/** Default fallback state when used outside of a PwaProvider (e.g., in isolated component unit tests). */
const DEFAULT_PWA_STATE = {
  needRefresh: false,
  updateApp: () => {},
  dismissUpdate: () => {},
  isInstallable: false,
  isInstalled: false,
  isIos: false,
  installApp: () => {},
  dismissInstall: () => {},
  showIosModal: false,
  setShowIosModal: () => {},
};

/**
 * Custom hook to access global PWA state and controls.
 *
 * Exposes:
 * - `needRefresh`: boolean indicating if a new service worker version is waiting.
 * - `updateApp`: function to activate update and reload the application.
 * - `dismissUpdate`: function to dismiss update prompt.
 * - `isInstallable`: boolean indicating if install CTA can be shown.
 * - `isInstalled`: boolean indicating if app is running in standalone mode.
 * - `isIos`: boolean indicating if client device is running iOS / iPadOS.
 * - `installApp`: function to trigger install flow (prompt or iOS guide modal).
 * - `dismissInstall`: function to dismiss install CTA.
 * - `showIosModal`: boolean controlling iOS install instructions modal.
 * - `setShowIosModal`: setter for iOS install instructions modal.
 *
 * @returns {object} PwaContext value or safe default fallback
 */
export function usePwa() {
  const context = useContext(PwaContext);
  return context || DEFAULT_PWA_STATE;
}

export default usePwa;
