import { planRepository } from '../repositories/planRepository.js';
import { categoryRepository } from '../repositories/categoryRepository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';

export const planService = {
  /**
   * Create a new membership plan (Admin only).
   */
  async createPlan({
    categoryId,
    name,
    description = null,
    durationDays,
    price,
    isActive = true,
  }) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) {
      throw new NotFoundError(
        'The specified plan category does not exist.',
        null,
        'CATEGORY_NOT_FOUND'
      );
    }

    if (!category.is_active) {
      throw new BadRequestError(
        'Cannot create a membership plan in an inactive category.',
        null,
        'INACTIVE_CATEGORY'
      );
    }

    const plan = await planRepository.create({
      categoryId,
      name,
      description,
      durationDays,
      price,
      isActive,
    });

    return {
      id: plan.id,
      categoryId: plan.category_id,
      categoryName: plan.category_name,
      name: plan.name,
      description: plan.description,
      durationDays: plan.duration_days,
      price: Number(plan.price),
      isActive: Boolean(plan.is_active),
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    };
  },

  /**
   * List plans with optional category filter, search, price range, and sort.
   */
  async listPlans(
    {
      categoryId = null,
      isActive = null,
      search = '',
      minPrice = null,
      maxPrice = null,
      sortBy = 'price',
      sortOrder = 'ASC',
    } = {},
    requestingUser = null
  ) {
    const isAdmin = requestingUser?.role === 'admin';

    // Non-admins see only active plans within active categories
    const filterIsActive = isAdmin ? isActive : true;
    const requireActiveCategory = !isAdmin;

    const plans = await planRepository.findAll({
      categoryId,
      isActive: filterIsActive,
      requireActiveCategory,
      search,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    });

    return plans.map((p) => ({
      id: p.id,
      categoryId: p.category_id,
      categoryName: p.category_name,
      categoryIsActive: Boolean(p.category_is_active),
      name: p.name,
      description: p.description,
      durationDays: p.duration_days,
      price: Number(p.price),
      isActive: Boolean(p.is_active),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  },

  /**
   * Get plan details by ID.
   */
  async getPlanById(id, requestingUser = null) {
    const isAdmin = requestingUser?.role === 'admin';
    const plan = await planRepository.findById(id);

    if (!plan) {
      throw new NotFoundError('Membership plan not found.', null, 'PLAN_NOT_FOUND');
    }

    // Non-admins cannot view inactive plans or plans of inactive categories
    if (!isAdmin && (!plan.is_active || !plan.category_is_active)) {
      throw new NotFoundError('Membership plan not found.', null, 'PLAN_NOT_FOUND');
    }

    return {
      id: plan.id,
      categoryId: plan.category_id,
      categoryName: plan.category_name,
      categoryIsActive: Boolean(plan.category_is_active),
      name: plan.name,
      description: plan.description,
      durationDays: plan.duration_days,
      price: Number(plan.price),
      isActive: Boolean(plan.is_active),
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
    };
  },

  /**
   * Update plan details.
   */
  async updatePlan(id, updateData) {
    const existing = await planRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Membership plan not found.', null, 'PLAN_NOT_FOUND');
    }

    if (updateData.categoryId !== undefined) {
      const category = await categoryRepository.findById(updateData.categoryId);
      if (!category) {
        throw new NotFoundError(
          'The specified plan category does not exist.',
          null,
          'CATEGORY_NOT_FOUND'
        );
      }
    }

    const updated = await planRepository.update(id, updateData);

    return {
      id: updated.id,
      categoryId: updated.category_id,
      categoryName: updated.category_name,
      categoryIsActive: Boolean(updated.category_is_active),
      name: updated.name,
      description: updated.description,
      durationDays: updated.duration_days,
      price: Number(updated.price),
      isActive: Boolean(updated.is_active),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },

  /**
   * Toggle plan active status.
   */
  async setPlanStatus(id, isActive) {
    const existing = await planRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Membership plan not found.', null, 'PLAN_NOT_FOUND');
    }

    const updated = await planRepository.update(id, { isActive });

    return {
      id: updated.id,
      name: updated.name,
      isActive: Boolean(updated.is_active),
      updatedAt: updated.updated_at,
    };
  },
};
