import { pool } from '../config/db.js';

export const discountRepository = {
  /**
   * Create a new discount record.
   */
  async create(
    {
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
    },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO discounts (
        code, name, description, discount_type, discount_value,
        max_discount_amount, min_purchase_amount, start_date, end_date,
        usage_limit, per_user_limit, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code.toUpperCase().trim(),
        name.trim(),
        description ? description.trim() : null,
        discountType,
        Number(discountValue),
        maxDiscountAmount !== null && maxDiscountAmount !== undefined ? Number(maxDiscountAmount) : null,
        Number(minPurchaseAmount) || 0.0,
        startDate,
        endDate,
        usageLimit !== null && usageLimit !== undefined ? Number(usageLimit) : null,
        Number(perUserLimit) || 1,
        Boolean(isActive),
      ]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Insert eligible plan mappings for a plan-specific discount.
   */
  async addPlanMappings(discountId, planIds = [], connection = pool) {
    if (!planIds || planIds.length === 0) return;

    const values = planIds.map((planId) => [discountId, planId]);
    await connection.query(
      `INSERT INTO discount_plans (discount_id, plan_id) VALUES ?`,
      [values]
    );
  },

  /**
   * Replace eligible plan mappings for a discount.
   */
  async setPlanMappings(discountId, planIds = [], connection = pool) {
    await connection.query(`DELETE FROM discount_plans WHERE discount_id = ?`, [discountId]);
    if (planIds && planIds.length > 0) {
      await this.addPlanMappings(discountId, planIds, connection);
    }
  },

  /**
   * Get plan IDs associated with a discount.
   */
  async getEligiblePlanIds(discountId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT plan_id FROM discount_plans WHERE discount_id = ?`,
      [discountId]
    );
    return rows.map((r) => r.plan_id);
  },

  /**
   * Find discount by primary key ID (including mapped plan IDs).
   */
  async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `SELECT * FROM discounts WHERE id = ?`,
      [id]
    );
    if (!rows[0]) return null;

    const discount = rows[0];
    const eligiblePlanIds = await this.getEligiblePlanIds(discount.id, connection);

    return {
      ...discount,
      eligible_plan_ids: eligiblePlanIds,
    };
  },

  /**
   * Find discount by unique code (case-insensitive).
   */
  async findByCode(code, connection = pool) {
    const [rows] = await connection.query(
      `SELECT * FROM discounts WHERE LOWER(code) = LOWER(?)`,
      [code.trim()]
    );
    if (!rows[0]) return null;

    const discount = rows[0];
    const eligiblePlanIds = await this.getEligiblePlanIds(discount.id, connection);

    return {
      ...discount,
      eligible_plan_ids: eligiblePlanIds,
    };
  },

  /**
   * Lock and retrieve discount row for update (ACID concurrency guard during checkout).
   */
  async findByCodeForUpdate(code, connection) {
    const [rows] = await connection.query(
      `SELECT * FROM discounts WHERE LOWER(code) = LOWER(?) FOR UPDATE`,
      [code.trim()]
    );
    if (!rows[0]) return null;

    const discount = rows[0];
    const eligiblePlanIds = await this.getEligiblePlanIds(discount.id, connection);

    return {
      ...discount,
      eligible_plan_ids: eligiblePlanIds,
    };
  },

  /**
   * Increment times_used count atomically.
   */
  async incrementTimesUsed(id, connection = pool) {
    const [result] = await connection.query(
      `UPDATE discounts SET times_used = times_used + 1 WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Count user redemptions of a specific discount (excluding cancelled subscriptions).
   */
  async getUserRedemptionCount(discountId, userId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count
       FROM subscriptions
       WHERE user_id = ? AND discount_id = ? AND status != 'cancelled'`,
      [userId, discountId]
    );
    return Number(rows[0].count);
  },

  /**
   * List all discounts with optional filters, search, and pagination.
   */
  async findAll(
    {
      isActive = null,
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = {},
    connection = pool
  ) {
    const whereClauses = [];
    const params = [];

    if (isActive !== null && isActive !== undefined) {
      whereClauses.push('is_active = ?');
      params.push(Boolean(isActive));
    }

    if (search && search.trim()) {
      whereClauses.push('(code LIKE ? OR name LIKE ? OR description LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSortFields = {
      code: 'code',
      name: 'name',
      discount_value: 'discount_value',
      start_date: 'start_date',
      end_date: 'end_date',
      times_used: 'times_used',
      created_at: 'created_at',
    };

    const sortColumn = allowedSortFields[sortBy] || 'created_at';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM discounts ${whereSql}`,
      params
    );
    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;
    const [rows] = await connection.query(
      `SELECT * FROM discounts
       ${whereSql}
       ORDER BY ${sortColumn} ${orderDirection}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    return {
      discounts: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Update discount details.
   */
  async update(id, updateData, connection = pool) {
    const fields = [];
    const values = [];

    if (updateData.name !== undefined) {
      fields.push('name = ?');
      values.push(updateData.name.trim());
    }
    if (updateData.description !== undefined) {
      fields.push('description = ?');
      values.push(updateData.description ? updateData.description.trim() : null);
    }
    if (updateData.discountType !== undefined) {
      fields.push('discount_type = ?');
      values.push(updateData.discountType);
    }
    if (updateData.discountValue !== undefined) {
      fields.push('discount_value = ?');
      values.push(Number(updateData.discountValue));
    }
    if (updateData.maxDiscountAmount !== undefined) {
      fields.push('max_discount_amount = ?');
      values.push(updateData.maxDiscountAmount !== null ? Number(updateData.maxDiscountAmount) : null);
    }
    if (updateData.minPurchaseAmount !== undefined) {
      fields.push('min_purchase_amount = ?');
      values.push(Number(updateData.minPurchaseAmount));
    }
    if (updateData.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(updateData.startDate);
    }
    if (updateData.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(updateData.endDate);
    }
    if (updateData.usageLimit !== undefined) {
      fields.push('usage_limit = ?');
      values.push(updateData.usageLimit !== null ? Number(updateData.usageLimit) : null);
    }
    if (updateData.perUserLimit !== undefined) {
      fields.push('per_user_limit = ?');
      values.push(Number(updateData.perUserLimit));
    }
    if (updateData.isActive !== undefined) {
      fields.push('is_active = ?');
      values.push(Boolean(updateData.isActive));
    }

    if (fields.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE discounts SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    return this.findById(id, connection);
  },
};
