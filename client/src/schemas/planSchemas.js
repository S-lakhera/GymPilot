import { z } from "zod";

/**
 * Validation schema for creating or updating a membership plan.
 */
export const planFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Plan name must be at least 2 characters")
    .max(100, "Plan name cannot exceed 100 characters"),
  description: z.string().trim().optional().default(""),
  categoryId: z.coerce
    .number()
    .int()
    .positive("Please select a valid plan category"),
  durationDays: z.coerce
    .number()
    .int()
    .min(1, "Duration must be at least 1 day")
    .max(3650, "Duration cannot exceed 3,650 days"),
  price: z.coerce
    .number()
    .min(0, "Price must be a non-negative amount"),
  isActive: z.boolean().default(true),
});

/**
 * Validation schema for creating or updating a plan category.
 */
export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters"),
  description: z.string().trim().optional().default(""),
  isActive: z.boolean().default(true),
});
