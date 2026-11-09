import { withTransaction } from "../config/db.js";
import { discountRepository } from "../repositories/discountRepository.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

export const discountService = {
  /**
   * Admin creates a new promotional discount / coupon.
   */
  async createDiscount({
    code,
    name,
    description = null,
    discountType,
    discountValue,
    maxDiscountAmount = null,
    minPurchaseAmount = 0.0,
    startDate,
    endDate,
    usageLimit = null,
    perUserLimit = 1,
    isActive = true,
    eligiblePlanIds = [],
  }) {
    const existing = await discountRepository.findByCode(code);
    if (existing) {
      throw new ConflictError(
        "A discount with this code already exists.",
        null,
        "DISCOUNT_CODE_EXISTS",
      );
    }

    return await withTransaction(async (conn) => {
      const discount = await discountRepository.create(
        {
          code,
          name,
          description,
          discountType,
          discountValue,
          maxDiscountAmount,
          minPurchaseAmount,
          startDate,
          endDate,
          usageLimit,
          perUserLimit,
          isActive,
        },
        conn,
      );

      if (eligiblePlanIds && eligiblePlanIds.length > 0) {
        await discountRepository.addPlanMappings(
          discount.id,
          eligiblePlanIds,
          conn,
        );
        discount.eligible_plan_ids = eligiblePlanIds;
      }

      return discount;
    });
  },

  /**
   * Admin lists all discounts with pagination and search.
   */
  async listDiscounts({
    isActive = null,
    search = "",
    page = 1,
    limit = 20,
    sortBy = "created_at",
    sortOrder = "DESC",
  } = {}) {
    return await discountRepository.findAll({
      isActive,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  },

  /**
   * Get discount details by ID.
   */
  async getDiscountById(id) {
    const discount = await discountRepository.findById(id);
    if (!discount) {
      throw new NotFoundError(
        "Discount not found.",
        null,
        "DISCOUNT_NOT_FOUND",
      );
    }
    return discount;
  },

  /**
   * Admin updates discount fields and/or eligible plan mappings.
   */
  async updateDiscount(id, updateData) {
    const existing = await discountRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(
        "Discount not found.",
        null,
        "DISCOUNT_NOT_FOUND",
      );
    }

    if (
      updateData.code &&
      updateData.code.trim().toUpperCase() !== existing.code.toUpperCase()
    ) {
      const duplicate = await discountRepository.findByCode(updateData.code);
      if (duplicate && duplicate.id !== Number(id)) {
        throw new ConflictError(
          "A discount with this code already exists.",
          null,
          "DISCOUNT_CODE_EXISTS",
        );
      }
    }

    return await withTransaction(async (conn) => {
      const updated = await discountRepository.update(id, updateData, conn);

      if (updateData.eligiblePlanIds !== undefined) {
        await discountRepository.setPlanMappings(
          id,
          updateData.eligiblePlanIds,
          conn,
        );
        updated.eligible_plan_ids = updateData.eligiblePlanIds;
      }

      return updated;
    });
  },

  /**
   * Toggle discount active status.
   */
  async setDiscountStatus(id, isActive) {
    const existing = await discountRepository.findById(id);
    if (!existing) {
      throw new NotFoundError(
        "Discount not found.",
        null,
        "DISCOUNT_NOT_FOUND",
      );
    }

    const updated = await discountRepository.update(id, { isActive });
    return {
      id: updated.id,
      code: updated.code,
      isActive: Boolean(updated.is_active),
      updatedAt: updated.updated_at,
    };
  },
};
