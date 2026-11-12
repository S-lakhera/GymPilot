import { z } from 'zod';

/**
 * Admin profile validation schema (personal identity only).
 */
export const adminProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'First name cannot exceed 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Last name cannot exceed 60 characters'),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
});

/**
 * Member profile validation schema.
 * Enforces calendar date verification for DOB, enum match for gender,
 * co-dependent emergency contacts (both or neither), and optional health conditions.
 */
export const memberProfileSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'First name is required')
      .max(60, 'First name cannot exceed 60 characters'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(60, 'Last name cannot exceed 60 characters'),
    phone: z
      .string()
      .trim()
      .max(20, 'Phone cannot exceed 20 characters')
      .optional()
      .or(z.literal('')),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date of birth must be in YYYY-MM-DD format')
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime()) && date <= new Date();
        },
        { message: 'Date of birth cannot be in the future' }
      )
      .optional()
      .or(z.literal('')),
    gender: z
      .enum(['male', 'female', 'other'], {
        errorMap: () => ({ message: 'Please select a valid gender option' }),
      })
      .optional()
      .or(z.literal('')),
    emergencyContactName: z
      .string()
      .trim()
      .max(100, 'Contact name cannot exceed 100 characters')
      .optional()
      .or(z.literal('')),
    emergencyContactPhone: z
      .string()
      .trim()
      .max(20, 'Emergency phone cannot exceed 20 characters')
      .optional()
      .or(z.literal('')),
    healthConditions: z
      .string()
      .trim()
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const hasName = Boolean(data.emergencyContactName?.trim());
      const hasPhone = Boolean(data.emergencyContactPhone?.trim());
      return (hasName && hasPhone) || (!hasName && !hasPhone);
    },
    {
      message: 'Both emergency contact name and phone number must be provided together',
      path: ['emergencyContactPhone'],
    }
  );

/**
 * Trainer profile validation schema.
 * Preprocesses experienceYears so empty string does not coerce to 0.
 */
export const trainerProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'First name cannot exceed 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Last name cannot exceed 60 characters'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(20, 'Phone cannot exceed 20 characters'),
  specialization: z
    .string()
    .trim()
    .min(1, 'Specialization is required')
    .max(100, 'Specialization cannot exceed 100 characters'),
  experienceYears: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Experience must be a valid number' })
      .int('Experience must be a whole number')
      .min(0, 'Experience years cannot be negative')
      .max(70, 'Experience years cannot exceed 70')
      .optional()
  ),
  certification: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
});
