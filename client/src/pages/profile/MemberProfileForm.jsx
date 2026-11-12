import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Heart,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import { userApi } from '../../api/userApi.js';
import { memberProfileSchema } from '../../schemas/profileSchemas.js';
import { mapServerErrorsToForm } from '../../utils/formErrorUtils.js';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Select } from '../../components/ui/select.jsx';
import { Textarea } from '../../components/ui/textarea.jsx';
import { Field, FieldLabel, FieldDescription, FieldError } from '../../components/ui/field.jsx';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card.jsx';

/**
 * Member Profile Form Component.
 * Supports asynchronous initialization, dirty state tracking,
 * emergency contact pairing, and privacy-first health notes.
 *
 * @returns {JSX.Element}
 */
export function MemberProfileForm() {
  const { user, profile, updateUserProfile } = useAuth();
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
    resolver: zodResolver(memberProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      healthConditions: '',
    },
  });

  // Asynchronously load and initialize form with existing profile data
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await userApi.getProfile();
        if (isMounted) {
          updateUserProfile(data);
          const u = data.user || {};
          const p = data.profile || {};
          reset({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            phone: u.phone || '',
            dateOfBirth: p.date_of_birth ? String(p.date_of_birth).substring(0, 10) : '',
            gender: p.gender || '',
            emergencyContactName: p.emergency_contact_name || '',
            emergencyContactPhone: p.emergency_contact_phone || '',
            healthConditions: p.health_conditions || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setFetchError(err.message || 'Failed to load member profile details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [reset, updateUserProfile]);

  /**
   * Submits member profile update and syncs AuthContext.
   *
   * @param {Object} formData
   */
  const onSubmit = async (formData) => {
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        emergencyContactName: formData.emergencyContactName?.trim() || undefined,
        emergencyContactPhone: formData.emergencyContactPhone?.trim() || undefined,
        healthConditions: formData.healthConditions?.trim() || undefined,
      };

      const result = await userApi.updateProfile(payload);
      updateUserProfile(result);
      reset(formData); // Reset baseline to mark form clean

      showToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Your member details have been saved successfully.',
      });
    } catch (err) {
      mapServerErrorsToForm(err, setError);
    }
  };

  if (loading) {
    return (
      <div className="gym-card p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-accent animate-spin" />
        <p className="text-sm text-text-secondary font-medium">Loading member profile...</p>
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
          <CardDescription>Update your basic contact details associated with your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="member-firstName" required>
                First Name
              </FieldLabel>
              <Input
                id="member-firstName"
                type="text"
                hasError={Boolean(errors.firstName)}
                placeholder="Vikram"
                {...register('firstName')}
              />
              <FieldError error={errors.firstName} />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-lastName" required>
                Last Name
              </FieldLabel>
              <Input
                id="member-lastName"
                type="text"
                hasError={Boolean(errors.lastName)}
                placeholder="Malhotra"
                {...register('lastName')}
              />
              <FieldError error={errors.lastName} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="member-email">
                Email Address <span className="text-text-muted font-normal text-[11px]">(Immutable)</span>
              </FieldLabel>
              <Input
                id="member-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="opacity-60 cursor-not-allowed bg-slate-900"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-phone">Phone Number</FieldLabel>
              <Input
                id="member-phone"
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

      {/* Member Profile Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Membership Details</CardTitle>
          <CardDescription>
            Required for full gym safety records and account completeness.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="member-dob">Date of Birth</FieldLabel>
              <Input
                id="member-dob"
                type="date"
                hasError={Boolean(errors.dateOfBirth)}
                {...register('dateOfBirth')}
              />
              <FieldError error={errors.dateOfBirth} />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-gender">Gender</FieldLabel>
              <Select
                id="member-gender"
                hasError={Boolean(errors.gender)}
                {...register('gender')}
              >
                <option value="">Select gender...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
              <FieldError error={errors.gender} />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Field>
              <FieldLabel htmlFor="member-emergencyName">Emergency Contact Name</FieldLabel>
              <Input
                id="member-emergencyName"
                type="text"
                hasError={Boolean(errors.emergencyContactName)}
                placeholder="Parent / Spouse / Guardian"
                {...register('emergencyContactName')}
              />
              <FieldError error={errors.emergencyContactName} />
            </Field>

            <Field>
              <FieldLabel htmlFor="member-emergencyPhone">Emergency Contact Phone</FieldLabel>
              <Input
                id="member-emergencyPhone"
                type="tel"
                hasError={Boolean(errors.emergencyContactPhone)}
                placeholder="+91-9999988888"
                {...register('emergencyContactPhone')}
              />
              <FieldError error={errors.emergencyContactPhone} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* Privacy-First Health Notes Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-emerald-accent" />
            <CardTitle>Health Conditions & Medical Notes</CardTitle>
          </div>
          <CardDescription>
            Optional medical notes for health and training considerations. Leave blank if none.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Field>
            <Textarea
              id="member-healthConditions"
              hasError={Boolean(errors.healthConditions)}
              rows={3}
              placeholder="e.g. Asthma, prior shoulder injury, hypertension, allergies..."
              {...register('healthConditions')}
            />
            <FieldDescription>
              This information is optional and is never shared in public member directories.
            </FieldDescription>
            <FieldError error={errors.healthConditions} />
          </Field>
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

export default MemberProfileForm;
