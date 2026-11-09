import { pool } from '../config/db.js';

export const refundRepository = {
  /**
   * Insert a new refund record into the immutable audit table.
   */
  async create(
    {
      paymentId,
      subscriptionId,
      userId,
      refundedById,
      amount,
      reason,
      refundStatus = 'COMPLETED',
      refundReference,
      gatewayRefundReference = null,
    },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO refunds (
        payment_id, subscription_id, user_id, refunded_by_id,
        amount, reason, refund_status, refund_reference,
        gateway_refund_reference
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        paymentId,
        subscriptionId,
        userId,
        refundedById,
        Number(amount),
        reason,
        refundStatus,
        refundReference,
        gatewayRefundReference || null,
      ]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Find refund by primary key with joined member, admin, and payment metadata.
   */
  async findById(id, connection = pool) {
    const query = `
      SELECT 
        rf.id,
        rf.payment_id,
        rf.subscription_id,
        rf.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        rf.refunded_by_id,
        CONCAT(a.first_name, ' ', a.last_name) AS refunded_by_name,
        rf.amount,
        rf.reason,
        rf.refund_status,
        rf.refund_reference,
        rf.gateway_refund_reference,
        rf.created_at,
        rf.updated_at,
        p.transaction_reference AS original_transaction_reference,
        p.amount AS original_payment_amount,
        p.payment_method
      FROM refunds rf
      INNER JOIN users u ON rf.user_id = u.id
      INNER JOIN users a ON rf.refunded_by_id = a.id
      INNER JOIN payments p ON rf.payment_id = p.id
      WHERE rf.id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Retrieve all refunds associated with a specific payment.
   */
  async findByPaymentId(paymentId, connection = pool) {
    const query = `
      SELECT 
        rf.id,
        rf.payment_id,
        rf.subscription_id,
        rf.user_id,
        rf.refunded_by_id,
        CONCAT(a.first_name, ' ', a.last_name) AS refunded_by_name,
        rf.amount,
        rf.reason,
        rf.refund_status,
        rf.refund_reference,
        rf.gateway_refund_reference,
        rf.created_at
      FROM refunds rf
      INNER JOIN users a ON rf.refunded_by_id = a.id
      WHERE rf.payment_id = ?
      ORDER BY rf.created_at DESC
    `;

    const [rows] = await connection.query(query, [paymentId]);
    return rows;
  },

  /**
   * Calculate cumulative successfully refunded total for a payment.
   */
  async getTotalRefundedForPayment(paymentId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT COALESCE(SUM(amount), 0.00) AS total_refunded
       FROM refunds
       WHERE payment_id = ? AND refund_status = 'COMPLETED'`,
      [paymentId]
    );

    return Number(rows[0]?.total_refunded || 0.0);
  },

  /**
   * List refunds with pagination and optional filters.
   */
  async findAll(
    {
      page = 1,
      limit = 20,
      paymentId = null,
      userId = null,
      refundedById = null,
      refundStatus = null,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = {},
    connection = pool
  ) {
    const whereClauses = [];
    const params = [];

    if (paymentId) {
      whereClauses.push('rf.payment_id = ?');
      params.push(Number(paymentId));
    }

    if (userId) {
      whereClauses.push('rf.user_id = ?');
      params.push(Number(userId));
    }

    if (refundedById) {
      whereClauses.push('rf.refunded_by_id = ?');
      params.push(Number(refundedById));
    }

    if (refundStatus) {
      whereClauses.push('rf.refund_status = ?');
      params.push(refundStatus);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const allowedSortFields = {
      created_at: 'rf.created_at',
      amount: 'rf.amount',
      refund_status: 'rf.refund_status',
    };

    const sortColumn = allowedSortFields[sortBy] || 'rf.created_at';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM refunds rf
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    const offset = (page - 1) * limit;
    const dataQuery = `
      SELECT 
        rf.id,
        rf.payment_id,
        rf.subscription_id,
        rf.user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        rf.refunded_by_id,
        CONCAT(a.first_name, ' ', a.last_name) AS refunded_by_name,
        rf.amount,
        rf.reason,
        rf.refund_status,
        rf.refund_reference,
        rf.gateway_refund_reference,
        rf.created_at
      FROM refunds rf
      INNER JOIN users u ON rf.user_id = u.id
      INNER JOIN users a ON rf.refunded_by_id = a.id
      ${whereSql}
      ORDER BY ${sortColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      refunds: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};

export default refundRepository;

