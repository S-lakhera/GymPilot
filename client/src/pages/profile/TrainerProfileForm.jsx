import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  RotateCcw,
  AlertCircle,
  Briefcase,
  ShieldCheck,
  Loader2,
  DollarSign,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { userApi } from '../../api/userApi.js';
import { trainerApi } from '../../api/trainerApi.js';
import { trainerProfileSchema } from '../../schemas/profileSchemas.js';
import { mapServerErrorsToForm } from '../../utils/formErrorUtils.js';
import { formatCurrency } from '../../utils/formatters.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Field, FieldLabel, FieldDescription, FieldError } from '../../components/ui/field.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.jsx';

/**
 * Trainer Profile Form Component.
 * Enables authenticated trainers to manage personal and professional info.
 * Resolves trainer ID strictly from authenticated user.id.
 * Salary and active status are read-only and explicitly guarded.
 *
 * @returns {JSX.Element}
 */
export function TrainerProfileForm() {
  const { user, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [readOnlySalary, setReadOnlySalary] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(trainerProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      specialization: '',
      experienceYears: '',
      certification: '',
      bio: '',
    },
  });

  useEffect(() => {
    let isMounted = true;

    async function loadTrainerProfile() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await userApi.getProfile();
        if (isMounted) {
          updateUserProfile(data);
          const u = data.user || {};
          const p = data.profile || {};
          setReadOnlySalary(p.monthly_salary || p.monthlySalary || null);
          reset({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phone: u.phone || '',
            specialization: p.specialization || '',
            experienceYears: p.experience_years ?? p.experienceYears ?? '',
            certification: p.certification || '',
            bio: p.bio || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load trainer profile details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrainerProfile();
    return () => {
      isMounted = false;
    };
  }, [reset, updateUserProfile]);

  /**
   * Submits trainer profile update using authenticated user.id.
   *
   * @param {Object} formData
   */
  const onSubmit = async (formData) => {
    if (!user?.id) {
      setError('root.server', { message: 'Authenticated user identifier missing.' });
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        experienceYears: formData.experienceYears !== undefined ? formData.experienceYears : undefined,
        certification: formData.certification?.trim() || undefined,
        bio: formData.bio?.trim() || undefined,
      };

      const result = await trainerApi.updateTrainerProfile(user.id, payload);
      updateUserProfile(result);
      reset(formData);

      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your trainer workspace profile has been saved successfully.',
      });
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    }
  };

  if (loading) {
    return (
      <div className="gym-card p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-accent animate-spin" />
        <p className="text-sm text-text-secondary font-medium">Loading trainer profile...</p>
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

      {/* Personal Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Contact information displayed across trainer directories.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="trainer-firstName" required>
                First Name
              </FieldLabel>
              <Input
                id="trainer-firstName"
                type="text"
                hasError={Boolean(errors.firstName)}
                placeholder="Alex"
                {...register('firstName')}
              />
              <FieldError error={errors.firstName} />
            </Field>

            <Field>
              <FieldLabel htmlFor="trainer-lastName" required>
                Last Name
              </FieldLabel>
              <Input
                id="trainer-lastName"
                type="text"
                hasError={Boolean(errors.lastName)}
                placeholder="Morgan"
                {...register('lastName')}
              />
              <FieldError error={errors.lastName} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="trainer-email">
                Email Address <span className="text-text-muted font-normal text-[11px]">(Immutable)</span>
              </FieldLabel>
              <Input
                id="trainer-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="opacity-60 cursor-not-allowed bg-slate-900"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="trainer-phone" required>
                Phone Number
              </FieldLabel>
              <Input
                id="trainer-phone"
                type="tel"
                hasError={Boolean(errors.phone)}
                placeholder="+91-9876543210"
                {...register('phone')}
              />
              <FieldError error={errors.phone} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Professional Training Specs Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-accent" />
            <CardTitle>Professional Qualifications</CardTitle>
          </div>
          <CardDescription>Your specialization, coaching experience, and bio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="trainer-specialization" required>
                Specialization
              </FieldLabel>
              <Input
                id="trainer-specialization"
                type="text"
                hasError={Boolean(errors.specialization)}
                placeholder="e.g. Strength & Conditioning, CrossFit, HIIT"
                {...register('specialization')}
              />
              <FieldError error={errors.specialization} />
            </Field>

            <Field>
              <FieldLabel htmlFor="trainer-experienceYears">
                Years of Experience
              </FieldLabel>
              <Input
                id="trainer-experienceYears"
                type="number"
                min="0"
                max="70"
                hasError={Boolean(errors.experienceYears)}
                placeholder="5"
                {...register('experienceYears')}
              />
              <FieldError error={errors.experienceYears} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="trainer-certification">
              Certifications & Credentials
            </FieldLabel>
            <Input
              id="trainer-certification"
              type="text"
              hasError={Boolean(errors.certification)}
              placeholder="e.g. ACE Certified Personal Trainer, CSCS, CPR/AED"
              {...register('certification')}
            />
            <FieldError error={errors.certification} />
          </Field>

          <Field>
            <FieldLabel htmlFor="trainer-bio">Professional Bio</FieldLabel>
            <Textarea
              id="trainer-bio"
              rows={3}
              hasError={Boolean(errors.bio)}
              placeholder="Brief summary of your fitness philosophy, background, and training achievements..."
              {...register('bio')}
            />
            <FieldError error={errors.bio} />
          </Field>
        </CardContent>
      </Card>

      {/* Read-Only Employment Information Card */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-2 text-text-secondary">
            <ShieldCheck className="w-5 h-5 text-emerald-accent" />
            <CardTitle className="text-sm font-semibold">Administrative Employment Status</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Salary, compensation, and staff active status can only be modified by a gym administrator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-brand-dark/80 border border-brand-border flex items-center justify-between">
              <span className="text-text-secondary">Monthly Salary</span>
              <span className="font-semibold text-text-primary">
                {readOnlySalary ? formatCurrency(readOnlySalary) : 'Confidential / Hourly'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-brand-dark/80 border border-brand-border flex items-center justify-between">
              <span className="text-text-secondary">Staff Account Status</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-status-success/15 text-status-success">
                Active Staff
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

export default TrainerProfileForm;
