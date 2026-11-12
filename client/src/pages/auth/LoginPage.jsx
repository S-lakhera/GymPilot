import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Dumbbell,
  LogIn,
  Shield,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { ROUTES } from "../../utils/constants.js";

/**
 * Authentication Login Page.
 * Authenticates user credentials and redirects to the intended destination
 * or the common `/dashboard` route.
 *
 * @returns {JSX.Element}
 */
export function LoginPage() {
  const { login, sessionExpiredMessage, clearSessionExpiredNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const navTimeoutRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  const fromLocation = location.state?.from;
  const destination = fromLocation
    ? typeof fromLocation === "string"
      ? fromLocation
      : `${fromLocation.pathname || ""}${fromLocation.search || ""}${fromLocation.hash || ""}` || ROUTES.DASHBOARD
    : ROUTES.DASHBOARD;

  /**
   * Executes credential login and redirects on success.
   *
   * @param {string} loginEmail
   * @param {string} loginPassword
   */
  const executeLogin = async (loginEmail, loginPassword) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const user = await login({ email: loginEmail, password: loginPassword });
      setSuccessMsg(`Welcome, ${user.firstName}! Redirecting...`);
      navTimeoutRef.current = setTimeout(() => {
        navigate(destination, { replace: true });
      }, 400);
    } catch (err) {
      setErrorMsg(
        err.message || "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    await executeLogin(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="gym-card max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-dark text-emerald-accent shadow-md mb-1">
            <Dumbbell className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-display text-text-primary">
            Sign in to GymPilot
          </h1>
          <p className="text-xs text-text-secondary">
            Enter your credentials to access your personalized workspace.
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredMessage && (
          <div className="p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-sm flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-xs">{sessionExpiredMessage}</p>
            </div>
            <button
              onClick={clearSessionExpiredNotice}
              className="text-xs underline hover:no-underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status Messages */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Dev Quick-Login Buttons */}
        {import.meta.env.DEV && (
          <div className="p-3 rounded-xl bg-workspace border border-workspace-border space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">
              Quick Test Login (Dev Only)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  executeLogin("admin@gympilot.com", "Password@123")
                }
                disabled={loading}
                className="p-2 rounded-lg bg-workspace-card border border-workspace-border hover:border-emerald-accent text-center text-xs font-semibold text-text-primary flex flex-col items-center gap-1 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  executeLogin("trainer.alex@gympilot.com", "Password@123")
                }
                disabled={loading}
                className="p-2 rounded-lg bg-workspace-card border border-workspace-border hover:border-emerald-accent text-center text-xs font-semibold text-text-primary flex flex-col items-center gap-1 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Trainer</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  executeLogin("rahul.sharma@gmail.com", "Password@123")
                }
                disabled={loading}
                className="p-2 rounded-lg bg-workspace-card border border-workspace-border hover:border-emerald-accent text-center text-xs font-semibold text-text-primary flex flex-col items-center gap-1 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Member</span>
              </button>
            </div>
          </div>
        )}

        {/* Credential Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="text-xs font-semibold text-text-secondary block mb-1">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="text-xs font-semibold text-text-secondary block mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border-workspace-border bg-workspace text-sm text-text-primary focus:border-emerald-accent focus:ring-emerald-accent/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="btn-primary w-full py-2.5 text-sm"
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-text-secondary pt-2 border-t border-workspace-border">
          Don't have an account?{" "}
          <Link
            to={ROUTES.REGISTER}
            className="text-emerald-dark font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
