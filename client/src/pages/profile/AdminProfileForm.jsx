import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  RotateCcw,
  AlertCircle,
  ShieldAlert,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { userApi } from '../../api/userApi.js';
import { adminProfileSchema } from '../../schemas/profileSchemas.js';
import { mapServerErrorsToForm } from '../../utils/formErrorUtils.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Field, FieldLabel, FieldError } from '../../components/ui/field.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.jsx';

/**
 * Admin Profile Form Component.
 * Allows administrators to update personal contact information.
 * Displays system administrative scope details without fabricating unsupported fields.
 *
 * @returns {JSX.Element}
 */
export function AdminProfileForm() {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(adminProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadAdminProfile() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await userApi.getProfile();
        if (isMounted) {
          updateUserProfile(data);
          const u = data.user || {};
          reset({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phone: u.phone || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load administrator details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAdminProfile();
    return () => {
      isMounted = false;
    };
  }, [reset, updateUserProfile]);

  /**
   * Submits administrator personal information update.
   *
   * @param {Object} formData
   */
  const onSubmit = async (formData) => {
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone?.trim() || undefined,
      };

      const result = await userApi.updateProfile(payload);
      updateUserProfile(result);
      reset(formData);

      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Administrator contact details saved successfully.',
      });
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    }
  };

  if (loading) {
    return (
      <div className="gym-card p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-accent animate-spin" />
        <p className="text-sm text-text-secondary font-medium">Loading administrator profile...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="gym-card p-6 border-status-danger/30 space-y-4">
        <div className="flex items-center gap-3 text-status-danger">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Failed to load profile details</h3>
        </div>
        <p className="text-xs text-text-secondary">{fetchError}</p>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Root Server Error Alert */}
      {errors.root?.server && (
        <div className="p-3.5 rounded-xl bg-status-danger/10 border border-status-danger/30 text-status-danger text-xs flex items-center gap-2 animate-slide-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errors.root.server.message}</span>
        </div>
      )}

      {/* Personal Contact Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Contact information associated with your administrator account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="admin-firstName" required>
                First Name
              </FieldLabel>
              <Input
                id="admin-firstName"
                type="text"
                hasError={Boolean(errors.firstName)}
                placeholder="Admin"
                {...register('firstName')}
              />
              <FieldError error={errors.firstName} />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-lastName" required>
                Last Name
              </FieldLabel>
              <Input
                id="admin-lastName"
                type="text"
                hasError={Boolean(errors.lastName)}
                placeholder="User"
                {...register('lastName')}
              />
              <FieldError error={errors.lastName} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="admin-email">
                Email Address <span className="text-text-muted font-normal text-[11px]">(Immutable)</span>
              </FieldLabel>
              <Input
                id="admin-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="opacity-60 cursor-not-allowed bg-slate-900"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="admin-phone">Phone Number</FieldLabel>
              <Input
                id="admin-phone"
                type="tel"
                hasError={Boolean(errors.phone)}
                placeholder="+91-9999999999"
                {...register('phone')}
              />
              <FieldError error={errors.phone} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Administrative Scope Card */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2 text-text-secondary">
            <KeyRound className="w-5 h-5 text-emerald-accent" />
            <CardTitle className="text-sm font-semibold">Administrative Access Level</CardTitle>
          </div>
          <CardDescription className="text-xs">
            System administration scope and permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-brand-dark/80 border border-brand-border flex items-center justify-between">
              <span className="text-text-secondary">Security Scope</span>
              <span className="font-semibold text-emerald-accent">
                Full System Access
              </span>
            </div>

            <div className="p-3 rounded-lg bg-brand-dark/80 border border-brand-border flex items-center justify-between">
              <span className="text-text-secondary">Account Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success">
                Active Administrator
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Action Bar with Dirty State Tracking */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || isSubmitting}
          onClick={() => reset()}
          className="cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Cancel Changes
        </Button>

        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={!isDirty || isSubmitting}
          className="cursor-pointer"
        >
          <Save className="w-4 h-4 mr-1.5" />
          {isSubmitting ? 'Saving Profile...' : 'Save Profile'}
        </Button>
      </div>
    </form>
  );
}

export default AdminProfileForm;
