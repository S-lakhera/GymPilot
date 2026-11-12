import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { authApi } from '../../api/authApi.js';
import { ROUTES } from '../../utils/constants.js';
import { changePasswordSchema } from '../../schemas/authSchemas.js';
import { mapServerErrorsToForm } from '../../utils/formErrorUtils.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Field, FieldLabel, FieldDescription, FieldError } from '../../components/ui/field.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.jsx';

/**
 * Change Password Form Component.
 * Validates new password with confirmation, enforces session termination semantics,
 * clears local session in AuthContext, and immediately redirects to /login.
 *
 * @returns {JSX.Element}
 */
export function ChangePasswordForm() {
  const { clearLocalSession } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  /**
   * Submits password change request.
   * Excludes confirmPassword from API request body.
   *
   * @param {{ currentPassword: string, newPassword: string }} data
   */
  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await authApi.changePassword({ currentPassword, newPassword });

      // Local session termination without redundant API logout call
      clearLocalSession();

      showToast({
        type: 'success',
        title: 'Password Changed',
        message: 'Your password was updated successfully. Please sign in with your new password.',
      });

      // Immediate graceful navigation to login page
      navigate(ROUTES.LOGIN, {
        replace: true,
        state: { notice: 'Password changed successfully. Please log in again.' },
      });
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    }
  };

  return (
    <Card className="max-w-xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-emerald-accent" />
          <CardTitle>Change Password</CardTitle>
        </div>
        <CardDescription>
          Update your account password. For your security, changing your password revokes all active refresh sessions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Session Invalidation Warning Banner */}
        <div className="mb-5 p-3.5 rounded-xl bg-status-warning/10 border border-status-warning/30 text-status-warning text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            When you change your password, your active session on this device will be terminated,
            and you will need to sign in again with your new credentials.
          </p>
        </div>

        {/* Server Error Alert */}
        {errors.root?.server && (
          <div className="mb-5 p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2 animate-slide-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errors.root.server.message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field>
            <FieldLabel htmlFor="pwd-current" required>
              Current Password
            </FieldLabel>
            <Input
              id="pwd-current"
              type={showCurrentPassword ? 'text' : 'password'}
              autoComplete="current-password"
              aria-required="true"
              disabled={isSubmitting}
              aria-describedby={errors.currentPassword ? 'pwd-current-error' : undefined}
              startIcon={Lock}
              hasError={Boolean(errors.currentPassword)}
              placeholder="••••••••"
              endSlot={
                <button
                  type="button"
                  aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent/50"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('currentPassword')}
            />
            <FieldError id="pwd-current-error" error={errors.currentPassword} />
          </Field>

          <Field>
            <FieldLabel htmlFor="pwd-new" required>
              New Password
            </FieldLabel>
            <Input
              id="pwd-new"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-required="true"
              disabled={isSubmitting}
              aria-describedby={errors.newPassword ? 'pwd-new-error' : undefined}
              startIcon={Lock}
              hasError={Boolean(errors.newPassword)}
              placeholder="Minimum 6 characters"
              endSlot={
                <button
                  type="button"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent/50"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('newPassword')}
            />
            <FieldDescription>
              Must be at least 6 characters long.
            </FieldDescription>
            <FieldError id="pwd-new-error" error={errors.newPassword} />
          </Field>

          <Field>
            <FieldLabel htmlFor="pwd-confirm" required>
              Confirm New Password
            </FieldLabel>
            <Input
              id="pwd-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              aria-required="true"
              disabled={isSubmitting}
              aria-describedby={errors.confirmPassword ? 'pwd-confirm-error' : undefined}
              startIcon={Lock}
              hasError={Boolean(errors.confirmPassword)}
              placeholder="Re-enter new password"
              endSlot={
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent/50"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              {...register('confirmPassword')}
            />
            <FieldError id="pwd-confirm-error" error={errors.confirmPassword} />
          </Field>

          <div className="pt-2">
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmitting}
              className="w-full py-2.5 text-sm cursor-pointer"
            >
              <KeyRound className="w-4 h-4 mr-1.5" />
              {isSubmitting ? 'Updating Password...' : 'Update Password & Re-authenticate'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ChangePasswordForm;
