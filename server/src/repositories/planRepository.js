import { pool } from '../config/db.js';

export const planRepository = {
  /**
   * Create a new membership plan.
   */
  async create(
    { categoryId, name, description = null, durationDays, price, isActive = true },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO plans (category_id, name, description, duration_days, price, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        categoryId,
        name.trim(),
        description ? description.trim() : null,
        Number(durationDays),
        Number(price),
        Boolean(isActive),
      ]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Find a plan by primary key ID, joined with its category.
   */
  async findById(id, connection = pool) {
    const query = `
      SELECT 
        p.id,
        p.category_id,
        pc.name AS category_name,
        pc.is_active AS category_is_active,
        p.name,
        p.description,
        p.duration_days,
        p.price,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM plans p
      INNER JOIN plan_categories pc ON p.category_id = pc.id
      WHERE p.id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * List all plans with optional filtering by category, active status, and search.
   */
  async findAll(
    {
      categoryId = null,
      isActive = null,
      requireActiveCategory = false,
      search = '',
      minPrice = null,
      maxPrice = null,
      sortBy = 'price',
      sortOrder = 'ASC',
    } = {},
    connection = pool
  ) {
    const whereClauses = [];
    const params = [];

    if (categoryId !== null && categoryId !== undefined) {
      whereClauses.push('p.category_id = ?');
      params.push(Number(categoryId));
    }

    if (isActive !== null && isActive !== undefined) {
      whereClauses.push('p.is_active = ?');
      params.push(Boolean(isActive));
    }

    if (requireActiveCategory) {
      whereClauses.push('pc.is_active = TRUE');
    }

    if (search && search.trim()) {
      whereClauses.push('(p.name LIKE ? OR p.description LIKE ? OR pc.name LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (minPrice !== null && minPrice !== undefined) {
      whereClauses.push('p.price >= ?');
      params.push(Number(minPrice));
    }

    if (maxPrice !== null && maxPrice !== undefined) {
      whereClauses.push('p.price <= ?');
      params.push(Number(maxPrice));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSortFields = {
      price: 'p.price',
      duration_days: 'p.duration_days',
      name: 'p.name',
      created_at: 'p.created_at',
      category: 'pc.name',
    };

    const sortColumn = allowedSortFields[sortBy] || 'p.price';
    const orderDirection = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const query = `
      SELECT 
        p.id,
        p.category_id,
        pc.name AS category_name,
        pc.is_active AS category_is_active,
        p.name,
        p.description,
        p.duration_days,
        p.price,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM plans p
      INNER JOIN plan_categories pc ON p.category_id = pc.id
      ${whereSql}
      ORDER BY ${sortColumn} ${orderDirection}
    `;

    const [rows] = await connection.query(query, params);
    return rows;
  },

  /**
   * Update plan fields.
   */
  async update(id, updateData, connection = pool) {
    const fields = [];
    const values = [];

    if (updateData.categoryId !== undefined) {
      fields.push('category_id = ?');
      values.push(Number(updateData.categoryId));
    }
    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name.trim());
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description ? updateData.description.trim() : null);
    }
    if (updateData.durationDays !== undefined) {
      fields.push('duration_days = ?');
      values.push(Number(updateData.durationDays));
    }
    if (updateData.price !== undefined) {
      fields.push('price = ?');
      values.push(Number(updateData.price));
    }
    if (updateData.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(Boolean(updateData.isActive));
    }

    if (fields.length === 0) {
      return this.findById(id, connection);
    }

    values.push(id);
    const query = `UPDATE plans SET ${fields.join(', ')} WHERE id = ?`;
    await connection.query(query, values);

    return this.findById(id, connection);
  },

  /**
   * Count subscriptions referencing this plan.
   */
  async countSubscriptionsByPlanId(planId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total_subscriptions
       FROM subscriptions
       WHERE plan_id = ?`,
      [planId]
    );
    return Number(rows[0].total_subscriptions);
  },
};

