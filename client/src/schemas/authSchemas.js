import { z } from "zod";

/**
 * Login form validation schema.
 */
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Registration form validation schema.
 * Aligns with backend express-validator rules in authRoutes.js.
 */
export const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(60, "First name cannot exceed 60 characters"),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .max(60, "Last name cannot exceed 60 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  phone: z
    .string()
    .trim()
    .max(20, "Phone cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
});

/**
 * Change password form validation schema.
 * Excludes confirmPassword from API submission via application logic.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });
