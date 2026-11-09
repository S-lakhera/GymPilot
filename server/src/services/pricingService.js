import { discountRepository } from "../repositories/discountRepository.js";
import { BadRequestError } from "../utils/errors.js";
import { DiscountType } from "../models/DiscountType.js";

export const pricingService = {
  /**
   * Get current calendar date string in YYYY-MM-DD format (IST / UTC+05:30).
   */
  getCurrentDateIST() {
    const now = new Date();
    // Offset by +05:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().slice(0, 10);
  },

  /**
   * Validate discount rules and calculate the final payable amount.
   * Completely backend-computed and safe against client tampering.
   */
  async validateAndCalculateDiscount({
    plan,
    discountCode = null,
    userId = null,
    connection = undefined,
    lockDiscount = false,
  }) {
    const baseAmount = Number(plan.price);

    // If no discount code provided, standard full pricing applies
    if (!discountCode || !discountCode.trim()) {
      return {
        baseAmount,
        discount: null,
        discountAmount: 0.0,
        finalAmount: baseAmount,
        currency: "INR",
      };
    }

    const code = discountCode.trim().toUpperCase();
    const discount =
      lockDiscount && connection
        ? await discountRepository.findByCodeForUpdate(code, connection)
        : await discountRepository.findByCode(code, connection);

    if (!discount || !discount.is_active) {
      throw new BadRequestError(
        "Invalid or inactive discount code.",
        null,
        "INVALID_DISCOUNT_CODE",
      );
    }

    const today = this.getCurrentDateIST();
    const startDate =
      typeof discount.start_date === "string"
        ? discount.start_date.slice(0, 10)
        : new Date(discount.start_date).toISOString().slice(0, 10);
    const endDate =
      typeof discount.end_date === "string"
        ? discount.end_date.slice(0, 10)
        : new Date(discount.end_date).toISOString().slice(0, 10);

    if (today < startDate || today > endDate) {
      throw new BadRequestError(
        "Discount code has expired or is not yet active.",
        null,
        "DISCOUNT_EXPIRED",
      );
    }

    if (baseAmount < Number(discount.min_purchase_amount)) {
      throw new BadRequestError(
        `Plan price (₹${baseAmount}) does not meet the minimum purchase amount of ₹${discount.min_purchase_amount} required for this discount.`,
        null,
        "DISCOUNT_MIN_AMOUNT_NOT_MET",
      );
    }

    // Check plan-specific eligibility if mapping exists
    if (discount.eligible_plan_ids && discount.eligible_plan_ids.length > 0) {
      const isEligible = discount.eligible_plan_ids
        .map(Number)
        .includes(Number(plan.id));
      if (!isEligible) {
        throw new BadRequestError(
          "This discount code is not applicable to the selected membership plan.",
          null,
          "DISCOUNT_PLAN_INELIGIBLE",
        );
      }
    }

    // Check global usage limit
    if (
      discount.usage_limit !== null &&
      discount.times_used >= discount.usage_limit
    ) {
      throw new BadRequestError(
        "This discount code has reached its maximum global usage limit.",
        null,
        "DISCOUNT_USAGE_LIMIT_REACHED",
      );
    }

    // Check per-user redemption limit if userId is provided
    if (userId) {
      const userRedemptions = await discountRepository.getUserRedemptionCount(
        discount.id,
        userId,
        connection,
      );
      if (userRedemptions >= discount.per_user_limit) {
        throw new BadRequestError(
          `You have already redeemed this discount code the maximum allowed number of times (${discount.per_user_limit}).`,
          null,
          "DISCOUNT_USER_LIMIT_REACHED",
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0.0;
    if (discount.discount_type === DiscountType.PERCENTAGE) {
      discountAmount = (baseAmount * Number(discount.discount_value)) / 100;
      if (
        discount.max_discount_amount !== null &&
        discount.max_discount_amount !== undefined
      ) {
        discountAmount = Math.min(
          discountAmount,
          Number(discount.max_discount_amount),
        );
      }
    } else {
      // FIXED discount
      discountAmount = Math.min(baseAmount, Number(discount.discount_value));
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    const finalAmount = Math.max(
      0,
      Math.round((baseAmount - discountAmount) * 100) / 100,
    );

    return {
      baseAmount,
      discount: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        discountType: discount.discount_type,
        discountValue: Number(discount.discount_value),
        maxDiscountAmount:
          discount.max_discount_amount !== null
            ? Number(discount.max_discount_amount)
            : null,
      },
      discountAmount,
      finalAmount,
      currency: "INR",
    };
  },
};
