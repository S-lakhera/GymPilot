import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dumbbell,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ROUTES } from '../../utils/constants.js';
import { registerSchema } from '../../schemas/authSchemas.js';
import { mapServerErrorsToForm } from '../../utils/formErrorUtils.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Field, FieldLabel, FieldError } from '../../components/ui/field.jsx';

/**
 * Public Member Registration Page.
 * Onboards new member using React Hook Form + Zod,
 * automatically establishes session upon registration,
 * and navigates to the member dashboard.
 *
 * @returns {JSX.Element}
 */
export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const navTimeoutRef = useRef(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  useEffect(() => {
    return () => {
      if (navTimeoutRef.current) {
        clearTimeout(navTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Submits member registration.
   *
   * @param {{ firstName: string, lastName: string, email: string, password: string, phone?: string }} data
   */
  const onSubmit = async (data) => {
    setSuccessMsg(null);
    try {
      const user = await registerUser(data);
      const greeting = `Welcome to GymPilot, ${user.firstName}!`;
      setSuccessMsg(`${greeting} Opening your dashboard...`);
      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Your member profile is ready. Enjoy your workout journey!',
      });

      navTimeoutRef.current = setTimeout(() => {
        navigate(ROUTES.DASHBOARD, { replace: true });
      }, 400);
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    }
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
            Create an Account
          </h1>
          <p className="text-xs text-text-secondary">
            Join GymPilot today to manage passes, schedules, and workouts.
          </p>
        </div>

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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="register-firstName" required>
                First Name
              </FieldLabel>
              <Input
                id="register-firstName"
                type="text"
                autoComplete="given-name"
                startIcon={User}
                hasError={Boolean(errors.firstName)}
                placeholder="Vikram"
                {...register('firstName')}
              />
              <FieldError error={errors.firstName} />
            </Field>

            <Field>
              <FieldLabel htmlFor="register-lastName" required>
                Last Name
              </FieldLabel>
              <Input
                id="register-lastName"
                type="text"
                autoComplete="family-name"
                hasError={Boolean(errors.lastName)}
                placeholder="Malhotra"
                {...register('lastName')}
              />
              <FieldError error={errors.lastName} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="register-email" required>
              Email Address
            </FieldLabel>
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              startIcon={Mail}
              hasError={Boolean(errors.email)}
              placeholder="vikram.m@example.com"
              {...register('email')}
            />
            <FieldError error={errors.email} />
          </Field>

          <Field>
            <FieldLabel htmlFor="register-password" required>
              Password
            </FieldLabel>
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
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

          <Field>
            <FieldLabel htmlFor="register-phone">
              Phone Number <span className="text-text-muted font-normal text-[11px]">(Optional)</span>
            </FieldLabel>
            <Input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              startIcon={Phone}
              hasError={Boolean(errors.phone)}
              placeholder="+91-9876543210"
              {...register('phone')}
            />
            <FieldError error={errors.phone} />
          </Field>

          <Button
            type="submit"
            isLoading={isSubmitting}
            className="w-full py-2.5 text-sm mt-1"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary pt-2 border-t border-workspace-border">
          Already registered?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="text-emerald-accent font-semibold hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
