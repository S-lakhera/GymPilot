import { pool } from '../config/db.js';

export const paymentRepository = {
  /**
   * Create a new payment record.
   */
  async create(
    {
      subscriptionId,
      userId,
      recordedById = null,
      amount,
      baseAmount,
      discountAmount = 0.0,
      currency = 'INR',
      paymentMethod,
      paymentStatus = 'PENDING',
      transactionReference,
      gatewayReference = null,
      paymentDate = new Date(),
    },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO payments (
        subscription_id, user_id, recorded_by_id, amount, base_amount,
        discount_amount, currency, payment_method, payment_status,
        transaction_reference, gateway_reference, payment_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscriptionId,
        userId,
        recordedById || null,
        Number(amount),
        Number(baseAmount),
        Number(discountAmount),
        currency,
        paymentMethod,
        paymentStatus,
        transactionReference,
        gatewayReference || null,
        paymentDate,
      ]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Find payment by primary key ID with joined user, subscription, plan, and recorder metadata.
   */
  async findById(id, connection = pool) {
    const query = `
      SELECT 
        p.id,
        p.subscription_id,
        p.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        p.recorded_by_id,
        CONCAT(r.first_name, ' ', r.last_name) AS recorded_by_name,
        p.amount,
        p.base_amount,
        p.discount_amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.gateway_reference,
        p.payment_date,
        p.created_at,
        COALESCE((
          SELECT SUM(rfd.amount)
          FROM refunds rfd
          WHERE rfd.payment_id = p.id AND rfd.refund_status = 'COMPLETED'
        ), 0.00) AS refunded_amount,
        s.plan_id,
        pl.name AS plan_name,
        pl.duration_days,
        s.status AS subscription_status,
        s.start_date AS subscription_start_date,
        s.end_date AS subscription_end_date
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN subscriptions s ON p.subscription_id = s.id
      INNER JOIN plans pl ON s.plan_id = pl.id
      LEFT JOIN users r ON p.recorded_by_id = r.id
      WHERE p.id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Find payment by its unique transaction reference.
   */
  async findByTransactionReference(transactionReference, connection = pool) {
    const query = `
      SELECT 
        p.id,
        p.subscription_id,
        p.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        p.recorded_by_id,
        p.amount,
        p.base_amount,
        p.discount_amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.gateway_reference,
        p.payment_date,
        p.created_at,
        COALESCE((
          SELECT SUM(rfd.amount)
          FROM refunds rfd
          WHERE rfd.payment_id = p.id AND rfd.refund_status = 'COMPLETED'
        ), 0.00) AS refunded_amount,
        s.plan_id,
        pl.name AS plan_name,
        s.status AS subscription_status,
        s.start_date AS subscription_start_date,
        s.end_date AS subscription_end_date,
        s.discount_id
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN subscriptions s ON p.subscription_id = s.id
      INNER JOIN plans pl ON s.plan_id = pl.id
      WHERE p.transaction_reference = ?
    `;

    const [rows] = await connection.query(query, [transactionReference]);
    return rows[0] || null;
  },

  /**
   * Lock payment row by transaction reference for update inside an ACID transaction.
   */
  async findByTransactionReferenceForUpdate(transactionReference, connection) {
    const query = `
      SELECT * FROM payments 
      WHERE transaction_reference = ? 
      FOR UPDATE
    `;
    const [rows] = await connection.query(query, [transactionReference]);
    return rows[0] || null;
  },

  /**
   * Lock payment row by primary key ID for update inside an ACID transaction.
   */
  async findByIdForUpdate(id, connection) {
    const query = `
      SELECT * FROM payments 
      WHERE id = ? 
      FOR UPDATE
    `;
    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Update payment status and optional gateway reference.
   */
  async updateStatus(id, { paymentStatus, gatewayReference = null, paymentDate = null }, connection = pool) {
    const fields = ['payment_status = ?'];
    const values = [paymentStatus];

    if (gatewayReference !== null && gatewayReference !== undefined) {
      fields.push('gateway_reference = ?');
      values.push(gatewayReference);
    }

    if (paymentDate !== null && paymentDate !== undefined) {
      fields.push('payment_date = ?');
      values.push(paymentDate);
    }

    values.push(id);
    const [result] = await connection.query(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return result.affectedRows > 0;
  },

  /**
   * Calculate total completed refund amount for a specific payment.
   */
  async getRefundedTotal(paymentId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0.00) AS total_refunded
       FROM refunds
       WHERE payment_id = ? AND refund_status = 'COMPLETED'`,
      [paymentId]
    );

    return Number(rows[0]?.total_refunded || 0.0);
  },

  /**
   * List payments with optional filtering, pagination, and sorting.
   */
  async findAll(
    {
      page = 1,
      limit = 20,
      userId = null,
      paymentStatus = null,
      paymentMethod = null,
      startDate = null,
      endDate = null,
      sortBy = 'payment_date',
      sortOrder = 'DESC',
    } = {},
    connection = pool
  ) {
    const whereClauses = [];
    const params = [];

    if (userId) {
      whereClauses.push('p.user_id = ?');
      params.push(Number(userId));
    }

    if (paymentStatus) {
      whereClauses.push('p.payment_status = ?');
      params.push(paymentStatus);
    }

    if (paymentMethod) {
      whereClauses.push('p.payment_method = ?');
      params.push(paymentMethod);
    }

    if (startDate) {
      whereClauses.push('p.payment_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('p.payment_date <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSortFields = {
      payment_date: 'p.payment_date',
      amount: 'p.amount',
      created_at: 'p.created_at',
      payment_status: 'p.payment_status',
    };

    const sortColumn = allowedSortFields[sortBy] || 'p.payment_date';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM payments p
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        p.id,
        p.subscription_id,
        p.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        p.recorded_by_id,
        CONCAT(r.first_name, ' ', r.last_name) AS recorded_by_name,
        p.amount,
        p.base_amount,
        p.discount_amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.transaction_reference,
        p.gateway_reference,
        p.payment_date,
        p.created_at,
        COALESCE((
          SELECT SUM(rfd.amount)
          FROM refunds rfd
          WHERE rfd.payment_id = p.id AND rfd.refund_status = 'COMPLETED'
        ), 0.00) AS refunded_amount,
        s.plan_id,
        pl.name AS plan_name,
        s.status AS subscription_status
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN subscriptions s ON p.subscription_id = s.id
      INNER JOIN plans pl ON s.plan_id = pl.id
      LEFT JOIN users r ON p.recorded_by_id = r.id
      ${whereSql}
      ORDER BY ${sortColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      payments: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Member receipt history (own payments).
   */
  async findByUserId(userId, { page = 1, limit = 20 } = {}, connection = pool) {
    return this.findAll({ page, limit, userId, sortBy: 'payment_date', sortOrder: 'DESC' }, connection);
  },
};

export default paymentRepository;

