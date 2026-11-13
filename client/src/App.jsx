import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { PwaProvider } from './context/PwaContext.jsx';
import { OfflineBanner } from './components/pwa/OfflineBanner.jsx';
import { PwaUpdatePrompt } from './components/pwa/PwaUpdatePrompt.jsx';
import { IosInstallModal } from './components/pwa/IosInstallModal.jsx';
import { AppRoutes } from './routes/AppRoutes.jsx';

/**
 * Root GymPilot Application Shell.
 * Integrates client-side routing, global floating toast notifications,
 * PWA lifecycle management (Service Worker, offline banner, update prompt),
 * and centralized Dual JWT authentication state management.
 *
 * @returns {JSX.Element} The root application component.
 */
export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <PwaProvider>
          <OfflineBanner />
          <PwaUpdatePrompt />
          <IosInstallModal />
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </PwaProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
