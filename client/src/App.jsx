import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { useAuth } from './hooks/useAuth.js';
import { SplashLoader } from './components/common/SplashLoader.jsx';
import { 
  Dumbbell, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  RefreshCw,
  Sparkles,
  LogIn,
  LogOut,
  UserCheck,
  AlertCircle,
  KeyRound,
  Shield,
  Zap
} from 'lucide-react';
import { formatCurrency, formatDate } from './utils/formatters.js';

/**
 * Interactive authentication testbench verifying Dual JWT, in-memory tokens,
 * HttpOnly cookies, and single-flight refresh mutex.
 *
 * @returns {JSX.Element} The rendered testbench component.
 */
function AuthTestbench() {
  const { 
    user, 
    profile, 
    isProfileComplete, 
    isAuthenticated, 
    role, 
    sessionExpiredMessage, 
    clearSessionExpiredNotice,
    restoreError,
    retryRestoreProfile,
    login, 
    logout 
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  /**
   * Authenticates using predefined seed credentials for testing roles.
   *
   * @param {string} email - Account email.
   * @param {string} password - Account password.
   * @returns {Promise<void>}
   */
  const handleQuickLogin = async (email, password) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const loggedInUser = await login({ email, password });
      setSuccessMsg(`Authenticated successfully as ${loggedInUser.firstName} (${loggedInUser.role})`);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Form submit handler for authenticating arbitrary user credentials.
   *
   * @param {React.FormEvent} e - Form submission event.
   * @returns {Promise<void>}
   */
  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!customEmail || !customPassword) return;
    await handleQuickLogin(customEmail, customPassword);
  };

  /**
   * Handles user logout and clears local session state.
   *
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await logout();
      setSuccessMsg('Logged out successfully. In-memory token purged.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retries fetching user profile following a network or server hiccup during startup.
   *
   * @returns {Promise<void>}
   */
  const handleRetryProfile = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await retryRestoreProfile();
      setSuccessMsg('Profile details loaded successfully.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reload profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gym-card space-y-6">
      <div className="border-b border-workspace-border pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-emerald-accent/15 text-emerald-dark text-xs font-semibold uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5" />
            Milestone 5.2 Testbench
          </div>
          <h2 className="text-xl font-bold text-text-primary">Live Authentication & Session Architecture</h2>
          <p className="text-sm text-text-secondary">
            Verifies Dual JWT, in-memory access token, HttpOnly refresh cookies, and silent session restoration.
          </p>
        </div>

        {isAuthenticated && (
          <button 
            onClick={handleLogout} 
            disabled={loading}
            className="btn-secondary text-status-danger border-status-danger/30 hover:bg-status-danger/10 text-xs py-2 px-3 self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" /> Logout
          </button>
        )}
      </div>

      {/* Session Expired Notice */}
      {sessionExpiredMessage && (
        <div className="p-4 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Session Terminated</p>
              <p className="text-xs opacity-90">{sessionExpiredMessage}</p>
            </div>
          </div>
          <button 
            onClick={clearSessionExpiredNotice} 
            className="text-xs underline hover:no-underline font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Recoverable Profile Details Error Notice */}
      {restoreError && isAuthenticated && (
        <div className="p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Could not load full profile details (network/server issue). Basic session credentials active.</span>
          </div>
          <button 
            onClick={handleRetryProfile}
            disabled={loading}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-sm flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isAuthenticated ? (
        /* Authenticated Session State */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-workspace-hover border border-workspace-border space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-dark text-emerald-accent flex items-center justify-center font-bold">
                  {user.firstName[0]}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-xs text-text-secondary">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-pill bg-brand-dark text-text-inverted text-xs font-bold uppercase tracking-wider">
                  Role: {role}
                </span>
                <span className={`px-2.5 py-1 rounded-pill text-xs font-semibold ${
                  isProfileComplete 
                    ? 'bg-status-success/15 text-status-success' 
                    : 'bg-status-warning/15 text-status-warning'
                }`}>
                  {isProfileComplete ? 'Profile Complete' : 'Profile Pending'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-workspace-card border border-workspace-border">
                <span className="text-text-muted block">Access Token</span>
                <span className="font-mono text-emerald-dark font-medium">In-Memory Active (Dual JWT)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-workspace-card border border-workspace-border">
                <span className="text-text-muted block">Refresh Session</span>
                <span className="font-mono text-text-primary font-medium">HttpOnly Cookie (7 Days)</span>
              </div>
              <div className="p-2.5 rounded-lg bg-workspace-card border border-workspace-border">
                <span className="text-text-muted block">Session Restoration</span>
                <span className="font-medium text-text-primary">Automatic on Page Reload</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Unauthenticated Quick-Login & Form */
        <div className="space-y-4">
          {import.meta.env.DEV && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary block mb-2">
                One-Click Test Account Authentication
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => handleQuickLogin('admin@gympilot.com', 'Password@123')}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-workspace-border hover:border-emerald-accent/50 bg-workspace-card hover:bg-workspace-hover text-left transition-all duration-150 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-text-primary">Admin</span>
                    <Shield className="w-4 h-4 text-emerald-accent" />
                  </div>
                  <div className="text-xs text-text-secondary truncate">admin@gympilot.com</div>
                </button>

                <button
                  onClick={() => handleQuickLogin('trainer.alex@gympilot.com', 'Password@123')}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-workspace-border hover:border-emerald-accent/50 bg-workspace-card hover:bg-workspace-hover text-left transition-all duration-150 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-text-primary">Trainer</span>
                    <Users className="w-4 h-4 text-emerald-accent" />
                  </div>
                  <div className="text-xs text-text-secondary truncate">trainer.alex@gympilot.com</div>
                </button>

                <button
                  onClick={() => handleQuickLogin('rahul.sharma@gmail.com', 'Password@123')}
                  disabled={loading}
                  className="p-3.5 rounded-xl border border-workspace-border hover:border-emerald-accent/50 bg-workspace-card hover:bg-workspace-hover text-left transition-all duration-150 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-text-primary">Member</span>
                    <UserCheck className="w-4 h-4 text-emerald-accent" />
                  </div>
                  <div className="text-xs text-text-secondary truncate">rahul.sharma@gmail.com</div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="pt-2 border-t border-workspace-border space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary block">
              Or Authenticate Custom Credentials
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="rounded-lg border-workspace-border bg-workspace-card text-sm focus:border-emerald-accent focus:ring-emerald-accent/20"
              />
              <input
                type="password"
                placeholder="Password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="rounded-lg border-workspace-border bg-workspace-card text-sm focus:border-emerald-accent focus:ring-emerald-accent/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !customEmail || !customPassword}
              className="btn-primary text-xs w-full sm:w-auto"
            >
              <LogIn className="w-3.5 h-3.5 mr-1.5" /> Sign In with Credentials
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * Main application layout rendering header, hero status banner,
 * live authentication testbench, and architecture cards.
 *
 * @returns {JSX.Element} The rendered main application shell.
 */
function MainApp() {
  const { isRestoring, isAuthenticated, user, role } = useAuth();

  // Full-screen branded splash loader on initial silent session restoration
  if (isRestoring) {
    return <SplashLoader message="Restoring GymPilot session..." />;
  }

  return (
    <div className="min-h-screen bg-workspace text-text-primary flex flex-col font-sans">
      {/* Brand Header */}
      <header className="bg-brand-dark border-b border-brand-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center shadow-md">
              <Dumbbell className="w-5 h-5 text-emerald-accent" />
            </div>
            <div>
              <span className="text-xl font-bold font-display text-text-inverted tracking-tight">
                GYM<span className="text-emerald-accent">PILOT</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-pill bg-brand-surface text-text-muted border border-brand-border font-medium">
                Milestone 5.2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                isAuthenticated 
                  ? 'bg-status-success shadow-glow-emerald animate-pulse' 
                  : 'bg-text-muted'
              }`} />
              <span className="text-xs font-medium text-text-muted hidden md:inline-block">
                {isAuthenticated ? `Logged in: ${user?.firstName} (${role})` : 'Guest Session'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Banner */}
        <section className="bg-brand-dark text-text-inverted rounded-2xl p-6 sm:p-10 border border-brand-border shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-emerald-accent/10 border border-emerald-accent/30 text-emerald-accent text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              API Layer & Centralized Auth Completed
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
              Single-Flight Refresh Mutex & In-Memory Token Management
            </h1>
            <p className="text-text-muted text-base sm:text-lg leading-relaxed">
              Dual JWT security architecture with silent session restoration on reload and centralized 401 error interception.
            </p>
          </div>

          {/* Decorative geometric accent */}
          <div className="absolute -right-16 -bottom-16 w-72 h-72 rounded-full bg-emerald-accent/5 blur-3xl pointer-events-none" />
        </section>

        {/* Live Authentication Testbench */}
        <AuthTestbench />

        {/* Architectural Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="gym-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">In-Memory Tokens</span>
              <KeyRound className="w-4 h-4 text-emerald-accent" />
            </div>
            <div className="text-lg font-bold text-text-primary">XSS Immunity</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Access tokens reside purely in memory. Refresh tokens are secured in HttpOnly cookies inaccessible to client scripts.
            </p>
          </div>

          <div className="gym-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Single-Flight Mutex</span>
              <ShieldCheck className="w-4 h-4 text-emerald-accent" />
            </div>
            <div className="text-lg font-bold text-text-primary">No Race Conditions</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Parallel 401 responses buffer in an execution queue while a single refresh rotates credentials and replays all calls seamlessly.
            </p>
          </div>

          <div className="gym-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Silent Restoration</span>
              <RefreshCw className="w-4 h-4 text-emerald-accent" />
            </div>
            <div className="text-lg font-bold text-text-primary">PWA Ready</div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Returning users bypass login forms automatically via the 7-day refresh session and land directly in their dashboard.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-brand-dark border-t border-brand-border py-6 text-center text-xs text-text-muted">
        GymPilot &copy; 2026. Phase 5.2 Centralized Authentication Architecture.
      </footer>
    </div>
  );
}

/**
 * Root GymPilot application component wrapped with AuthProvider.
 *
 * @returns {JSX.Element} The root application component.
 */
export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
