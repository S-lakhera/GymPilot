import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dumbbell,
  LogIn,
  Shield,
  Users,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Mail,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { ROUTES } from '../../utils/constants.js';
import { loginSchema } from '../../schemas/authSchemas.js';
import { mapServerErrorsToForm } from '../../utils/formErrorUtils.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Field, FieldLabel, FieldError } from '../../components/ui/field.jsx';

/**
 * Authentication Login Page.
 * Authenticates user credentials via React Hook Form + Zod,
 * supports password visibility toggle, preserves intended destination,
 * and features development quick-login buttons.
 *
 * @returns {JSX.Element}
 */
export function LoginPage() {
  const { login, sessionExpiredMessage, clearSessionExpiredNotice } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const navTimeoutRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  const fromLocation = location.state?.from;
  const destination = fromLocation
    ? typeof fromLocation === 'string'
      ? fromLocation
      : `${fromLocation.pathname || ''}${fromLocation.search || ''}${fromLocation.hash || ''}` || ROUTES.DASHBOARD
    : ROUTES.DASHBOARD;

  /**
   * Executes credential login and redirects on success.
   *
   * @param {{ email: string, password: string }} data
   */
  const onSubmit = async (data) => {
    setSuccessMsg(null);
    try {
      const user = await login(data);
      const greeting = `Welcome back, ${user.firstName}!`;
      setSuccessMsg(`${greeting} Redirecting...`);
      showToast({
        type: 'success',
        title: 'Signed In',
        message: greeting,
      });

      navTimeoutRef.current = setTimeout(() => {
        navigate(destination, { replace: true });
      }, 350);
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    }
  };

  /**
   * Quick login helper for development testing.
   *
   * @param {string} quickEmail
   * @param {string} quickPassword
   */
  const handleQuickLogin = async (quickEmail, quickPassword) => {
    setValue('email', quickEmail, { shouldValidate: true });
    setValue('password', quickPassword, { shouldValidate: true });
    await onSubmit({ email: quickEmail, password: quickPassword });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="gym-card max-w-md w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-dark text-emerald-accent shadow-md mb-1 border border-brand-border">
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
              type="button"
              onClick={clearSessionExpiredNotice}
              className="text-xs underline hover:no-underline font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Root Server Error Alert */}
        {errors.root?.server && (
          <div className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2 animate-slide-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.root.server.message}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-status-success/10 border border-status-success/30 text-status-success text-xs flex items-center gap-2 animate-slide-in">
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
                onClick={() => handleQuickLogin('admin@gympilot.com', 'Password@123')}
                disabled={isSubmitting}
                className="p-2 rounded-lg bg-workspace-card border border-workspace-border hover:border-emerald-accent text-center text-xs font-semibold text-text-primary flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('trainer.alex@gympilot.com', 'Password@123')}
                disabled={isSubmitting}
                className="p-2 rounded-lg bg-workspace-card border border-workspace-border hover:border-emerald-accent text-center text-xs font-semibold text-text-primary flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Users className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Trainer</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('rahul.sharma@gmail.com', 'Password@123')}
                disabled={isSubmitting}
                className="p-2 rounded-lg bg-workspace-card border border-workspace-border hover:border-emerald-accent text-center text-xs font-semibold text-text-primary flex flex-col items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-accent" />
                <span>Member</span>
              </button>
            </div>
          </div>
        )}

        {/* Credential Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field>
            <FieldLabel htmlFor="login-email" required>
              Email Address
            </FieldLabel>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              startIcon={Mail}
              hasError={Boolean(errors.email)}
              placeholder="you@example.com"
              {...register('email')}
            />
            <FieldError error={errors.email} />
          </Field>

          <Field>
            <FieldLabel htmlFor="login-password" required>
              Password
            </FieldLabel>
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              startIcon={Lock}
              hasError={Boolean(errors.password)}
              placeholder="••••••••"
              endSlot={
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('password')}
            />
            <FieldError error={errors.password} />
          </Field>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full py-2.5 text-sm"
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-text-secondary pt-2 border-t border-workspace-border">
          Don't have an account?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="text-emerald-accent font-semibold hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
