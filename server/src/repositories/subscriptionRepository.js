import { pool } from '../config/db.js';

export const subscriptionRepository = {
  /**
   * Insert a new subscription record.
   */
  async create(
    {
      userId,
      planId,
      startDate,
      endDate,
      baseAmount,
      discountId = null,
      discountAmount = 0.0,
      finalAmount,
      currency = 'INR',
      status = 'pending_payment',
    },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO subscriptions (
        user_id, plan_id, start_date, end_date,
        base_amount, discount_id, discount_amount, final_amount,
        currency, price_paid, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        planId,
        startDate,
        endDate,
        Number(baseAmount),
        discountId || null,
        Number(discountAmount),
        Number(finalAmount),
        currency,
        Number(finalAmount), // price_paid mirrors final_amount for backward compatibility
        status,
      ]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Find subscription by ID with joined plan, category, user, and discount details.
   */
  async findById(id, connection = pool) {
    const query = `
      SELECT 
        s.id,
        s.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        s.plan_id,
        p.name AS plan_name,
        p.duration_days,
        p.category_id,
        pc.name AS category_name,
        s.start_date,
        s.end_date,
        s.base_amount,
        s.discount_id,
        d.code AS discount_code,
        s.discount_amount,
        s.final_amount,
        s.price_paid,
        s.currency,
        s.status,
        s.created_at,
        s.updated_at
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN plans p ON s.plan_id = p.id
      INNER JOIN plan_categories pc ON p.category_id = pc.id
      LEFT JOIN discounts d ON s.discount_id = d.id
      WHERE s.id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Lock subscription row for update.
   */
  async findByIdForUpdate(id, connection) {
    const [rows] = await connection.query(
      `SELECT * FROM subscriptions WHERE id = ? FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Query active and queued subscriptions for a member within a specific plan category.
   * Used for overlap checks and renewal chaining.
   */
  async findCategorySubscriptions(userId, categoryId, connection = pool) {
    const query = `
      SELECT 
        s.id,
        s.user_id,
        s.plan_id,
        p.category_id,
        s.start_date,
        s.end_date,
        s.status
      FROM subscriptions s
      INNER JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
        AND p.category_id = ?
        AND s.status IN ('active', 'queued')
      ORDER BY s.end_date DESC
    `;

    const [rows] = await connection.query(query, [userId, categoryId]);
    return rows;
  },

  /**
   * Find the queued subscription for a user in a specific category (if one exists).
   */
  async findQueuedSubscriptionInCategory(userId, categoryId, connection = pool) {
    const query = `
      SELECT s.*, p.duration_days
      FROM subscriptions s
      INNER JOIN plans p ON s.plan_id = p.id
      WHERE s.user_id = ?
        AND p.category_id = ?
        AND s.status = 'queued'
      ORDER BY s.start_date ASC
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [userId, categoryId]);
    return rows[0] || null;
  },

  /**
   * Update subscription status.
   */
  async updateStatus(id, status, connection = pool) {
    const [result] = await connection.query(
      `UPDATE subscriptions SET status = ? WHERE id = ?`,
      [status, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Update subscription dates and status (used when promoting or rescheduling queued renewals).
   */
  async updateDatesAndStatus(id, { startDate, endDate, status }, connection = pool) {
    const fields = [];
    const values = [];

    if (startDate) {
      fields.push('start_date = ?');
      values.push(startDate);
    }
    if (endDate) {
      fields.push('end_date = ?');
      values.push(endDate);
    }
    if (status) {
      fields.push('status = ?');
      values.push(status);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const [result] = await connection.query(
      `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * List subscriptions with optional filters, pagination, and sorting.
   */
  async findAll(
    {
      page = 1,
      limit = 20,
      userId = null,
      categoryId = null,
      status = null,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = {},
    connection = pool
  ) {
    const whereClauses = [];
    const params = [];

    if (userId) {
      whereClauses.push('s.user_id = ?');
      params.push(Number(userId));
    }

    if (categoryId) {
      whereClauses.push('p.category_id = ?');
      params.push(Number(categoryId));
    }

    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSortFields = {
      start_date: 's.start_date',
      end_date: 's.end_date',
      price_paid: 's.price_paid',
      created_at: 's.created_at',
      status: 's.status',
    };

    const sortColumn = allowedSortFields[sortBy] || 's.created_at';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM subscriptions s
      INNER JOIN plans p ON s.plan_id = p.id
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        s.id,
        s.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        s.plan_id,
        p.name AS plan_name,
        p.duration_days,
        p.category_id,
        pc.name AS category_name,
        s.start_date,
        s.end_date,
        s.base_amount,
        s.discount_id,
        d.code AS discount_code,
        s.discount_amount,
        s.final_amount,
        s.price_paid,
        s.currency,
        s.status,
        s.created_at,
        s.updated_at
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN plans p ON s.plan_id = p.id
      INNER JOIN plan_categories pc ON p.category_id = pc.id
      LEFT JOIN discounts d ON s.discount_id = d.id
      ${whereSql}
      ORDER BY ${sortColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      subscriptions: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};
