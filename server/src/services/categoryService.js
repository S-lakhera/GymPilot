import { categoryRepository } from '../repositories/categoryRepository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

export const categoryService = {
  /**
   * Create a new plan category (Admin only).
   */
  async createCategory({ name, description = null, isActive = true }) {
    const existing = await categoryRepository.findByName(name);
    if (existing) {
      throw new ConflictError(
        'A plan category with this name already exists.',
        null,
        'CATEGORY_EXISTS'
      );
    }

    return categoryRepository.create({ name, description, isActive });
  },

  /**
   * List categories (public or filtered).
   */
  async listCategories({ includeInactive = false, search = '' } = {}) {
    const filterActive = includeInactive ? null : true;
    const categories = await categoryRepository.findAll({
      isActive: filterActive,
      search,
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isActive: Boolean(c.is_active),
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
  },

  /**
   * Get category by ID.
   */
  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found.', null, 'CATEGORY_NOT_FOUND');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: Boolean(category.is_active),
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  },

  /**
   * Update category details.
   */
  async updateCategory(id, updateData) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found.', null, 'CATEGORY_NOT_FOUND');
    }

    if (updateData.name && updateData.name.trim().toLowerCase() !== existing.name.toLowerCase()) {
      const duplicate = await categoryRepository.findByName(updateData.name);
      if (duplicate && duplicate.id !== Number(id)) {
        throw new ConflictError(
          'A plan category with this name already exists.',
          null,
          'CATEGORY_EXISTS'
        );
      }
    }

    const updated = await categoryRepository.update(id, updateData);
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      isActive: Boolean(updated.is_active),
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },

  /**
   * Toggle category active status.
   */
  async setCategoryStatus(id, isActive) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found.', null, 'CATEGORY_NOT_FOUND');
    }

    const updated = await categoryRepository.update(id, { isActive });
    return {
      id: updated.id,
      name: updated.name,
      isActive: Boolean(updated.is_active),
      updatedAt: updated.updated_at,
    };
  },
};
