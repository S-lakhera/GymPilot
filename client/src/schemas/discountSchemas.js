import { z } from "zod";

/**
 * Validation schema for creating or updating a promotional discount coupon.
 */
export const discountFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code cannot exceed 20 characters")
      .toUpperCase(),
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    description: z.string().trim().optional().default(""),
    discountType: z.enum(["PERCENTAGE", "FIXED"], {
      errorMap: () => ({ message: "Please select either PERCENTAGE or FIXED" }),
    }),
    discountValue: z.coerce
      .number()
      .min(0.01, "Discount value must be greater than 0"),
    maxDiscountAmount: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number().nullable().optional()
    ),
    minPurchaseAmount: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
      z.number().min(0).optional().default(0)
    ),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be formatted YYYY-MM-DD"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be formatted YYYY-MM-DD"),
    usageLimit: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
      z.number().int().positive().nullable().optional()
    ),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENTAGE" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
      }
      return true;
    },
    {
      message: "End date must be on or after the start date",
      path: ["endDate"],
    }
  );

