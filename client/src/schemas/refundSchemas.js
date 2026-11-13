import { z } from "zod";

/**
 * Validation schema for processing a payment refund.
 */
export const refundFormSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.01, "Refund amount must be greater than 0"),
  reason: z
    .string()
    .trim()
    .min(3, "Reason must be at least 3 characters long")
    .max(255, "Reason cannot exceed 255 characters"),
});
