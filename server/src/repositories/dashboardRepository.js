import { pool } from '../config/db.js';

export const dashboardRepository = {
  // ===========================================================================
  // ADMIN DASHBOARD QUERIES
  // ===========================================================================

  /**
   * Retrieve membership counts: total members, active members, active trainers.
   * Uses conditional aggregation to produce all metrics in a single query.
   * Filters out soft-deleted users (deleted_at IS NULL).
   */
  async getAdminMembershipStats(connection = pool) {
    const query = `
      SELECT
        COUNT(CASE WHEN role = 'member' AND deleted_at IS NULL THEN 1 END) AS total_members,
        COUNT(CASE WHEN role = 'member' AND is_active = TRUE AND deleted_at IS NULL THEN 1 END) AS active_members,
        COUNT(CASE WHEN role = 'trainer' AND is_active = TRUE AND deleted_at IS NULL THEN 1 END) AS active_trainers
      FROM users
    `;

    const [rows] = await connection.query(query);
    return {
      totalMembers: Number(rows[0].total_members),
      activeMembers: Number(rows[0].active_members),
      activeTrainers: Number(rows[0].active_trainers),
    };
  },

  /**
   * Retrieve subscription status counts using self-healing date-based logic.
   * Active: status IN ('active','queued') AND start_date <= TODAY AND end_date >= TODAY
   *    OR  status = 'active' (DB status says active)
   * Self-healing: queries don't rely on the daily cron having run.
   */
  async getAdminSubscriptionStats(connection = pool) {
    const query = `
      SELECT
        COUNT(CASE
          WHEN (status = 'active' AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)
          THEN 1
        END) AS active_subscriptions,
        COUNT(CASE
          WHEN status = 'queued'
          THEN 1
        END) AS queued_subscriptions,
        COUNT(CASE
          WHEN status = 'active'
            AND end_date >= CURRENT_DATE
            AND end_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
          THEN 1
        END) AS expiring_soon,
        COUNT(CASE
          WHEN status = 'expired'
            OR (status = 'active' AND end_date < CURRENT_DATE)
          THEN 1
        END) AS expired_subscriptions
      FROM subscriptions
    `;

    const [rows] = await connection.query(query);
    return {
      activeSubscriptions: Number(rows[0].active_subscriptions),
      queuedSubscriptions: Number(rows[0].queued_subscriptions),
      expiringSoon: Number(rows[0].expiring_soon),
      expiredSubscriptions: Number(rows[0].expired_subscriptions),
    };
  },

  /**
   * Retrieve gross completed payment stats (total, MTD, today, pending count).
   * Only counts payments with status IN ('COMPLETED','PARTIALLY_REFUNDED','REFUNDED').
   * Separate from refund aggregation to prevent cartesian row multiplication.
   */
  async getAdminFinancialStats(connection = pool) {
    const query = `
      SELECT
        COALESCE(SUM(
          CASE WHEN payment_status IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED')
          THEN amount ELSE 0 END
        ), 0) AS gross_revenue,
        COALESCE(SUM(
          CASE WHEN payment_status IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED')
            AND YEAR(payment_date) = YEAR(CURRENT_DATE)
            AND MONTH(payment_date) = MONTH(CURRENT_DATE)
          THEN amount ELSE 0 END
        ), 0) AS gross_revenue_mtd,
        COALESCE(SUM(
          CASE WHEN payment_status IN ('COMPLETED', 'PARTIALLY_REFUNDED', 'REFUNDED')
            AND DATE(payment_date) = CURRENT_DATE
          THEN amount ELSE 0 END
        ), 0) AS gross_revenue_today,
        COUNT(CASE WHEN payment_status = 'PENDING' THEN 1 END) AS pending_payments
      FROM payments
    `;

    const [rows] = await connection.query(query);
    return {
      grossRevenue: Number(rows[0].gross_revenue),
      grossRevenueMtd: Number(rows[0].gross_revenue_mtd),
      grossRevenueToday: Number(rows[0].gross_revenue_today),
      pendingPayments: Number(rows[0].pending_payments),
    };
  },

  /**
   * Retrieve completed refund aggregates (total, MTD, today).
   * Kept as a separate query from payments to avoid cartesian products.
   */
  async getAdminRefundStats(connection = pool) {
    const query = `
      SELECT
        COALESCE(SUM(
          CASE WHEN refund_status = 'COMPLETED' THEN amount ELSE 0 END
        ), 0) AS total_refunded,
        COALESCE(SUM(
          CASE WHEN refund_status = 'COMPLETED'
            AND YEAR(created_at) = YEAR(CURRENT_DATE)
            AND MONTH(created_at) = MONTH(CURRENT_DATE)
          THEN amount ELSE 0 END
        ), 0) AS refunded_mtd,
        COALESCE(SUM(
          CASE WHEN refund_status = 'COMPLETED'
            AND DATE(created_at) = CURRENT_DATE
          THEN amount ELSE 0 END
        ), 0) AS refunded_today
      FROM refunds
    `;

    const [rows] = await connection.query(query);
    return {
      totalRefunded: Number(rows[0].total_refunded),
      refundedMtd: Number(rows[0].refunded_mtd),
      refundedToday: Number(rows[0].refunded_today),
    };
  },

  /**
   * Retrieve active subscription distribution by plan category.
   * Uses LEFT JOIN to include categories with zero active subscriptions.
   * Self-healing: applies date-based active check alongside DB status.
   */
  async getAdminCategoryDistribution(connection = pool) {
    const query = `
      SELECT
        pc.id AS category_id,
        pc.name AS category_name,
        COUNT(
          CASE
            WHEN s.status = 'active'
              AND s.start_date <= CURRENT_DATE
              AND s.end_date >= CURRENT_DATE
            THEN 1
          END
        ) AS active_count
      FROM plan_categories pc
      LEFT JOIN plans p ON p.category_id = pc.id
      LEFT JOIN subscriptions s ON s.plan_id = p.id
      WHERE pc.is_active = TRUE
      GROUP BY pc.id, pc.name
      ORDER BY active_count DESC
    `;

    const [rows] = await connection.query(query);
    return rows.map((row) => ({
      categoryId: Number(row.category_id),
      categoryName: row.category_name,
      activeCount: Number(row.active_count),
    }));
  },

  /**
   * Retrieve most recent payment transactions for admin feed.
   * Joins payments → users → subscriptions → plans for full context.
   */
  async getAdminRecentTransactions(limit = 5, connection = pool) {
    const query = `
      SELECT
        p.id AS payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.payment_date,
        p.transaction_reference,
        CONCAT(u.first_name, ' ', u.last_name) AS member_name,
        u.email AS member_email,
        pl.name AS plan_name
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      INNER JOIN subscriptions s ON p.subscription_id = s.id
      INNER JOIN plans pl ON s.plan_id = pl.id
      ORDER BY p.payment_date DESC
      LIMIT ?
    `;

    const [rows] = await connection.query(query, [Number(limit)]);
    return rows;
  },

  /**
   * Retrieve most recently registered members for admin feed.
   * Filters out soft-deleted members.
   */
  async getAdminRecentMembers(limit = 5, connection = pool) {
    const query = `
      SELECT
        u.id,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone,
        u.is_active,
        u.created_at
      FROM users u
      WHERE u.role = 'member' AND u.deleted_at IS NULL
      ORDER BY u.created_at DESC
      LIMIT ?
    `;

    const [rows] = await connection.query(query, [Number(limit)]);
    return rows;
  },

  // ===========================================================================
  // TRAINER DASHBOARD QUERIES
  // ===========================================================================

  /**
   * Retrieve trainer profile with user details.
   * Returns null if the user has no trainer profile.
   */
  async getTrainerProfile(trainerUserId, connection = pool) {
    const query = `
      SELECT
        u.id AS user_id,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone,
        u.is_active,
        tp.specialization,
        tp.experience_years,
        tp.certification,
        tp.bio,
        tp.monthly_salary
      FROM users u
      LEFT JOIN trainer_profiles tp ON tp.user_id = u.id
      WHERE u.id = ? AND u.role = 'trainer' AND u.deleted_at IS NULL
    `;

    const [rows] = await connection.query(query, [Number(trainerUserId)]);
    return rows[0] || null;
  },

  // ===========================================================================
  // MEMBER DASHBOARD QUERIES
  // ===========================================================================

  /**
   * Retrieve active and queued subscriptions for a specific member.
   * Self-healing: uses date-based active check.
   * Computes days_remaining for active passes.
   */
  async getMemberSubscriptions(memberUserId, connection = pool) {
    const query = `
      SELECT
        s.id AS subscription_id,
        s.plan_id,
        pl.name AS plan_name,
        pc.name AS category_name,
        s.start_date,
        s.end_date,
        s.status,
        s.final_amount,
        s.currency,
        CASE
          WHEN s.status = 'active' AND s.end_date >= CURRENT_DATE
            THEN GREATEST(0, DATEDIFF(s.end_date, CURRENT_DATE))
          ELSE 0
        END AS days_remaining
      FROM subscriptions s
      INNER JOIN plans pl ON s.plan_id = pl.id
      INNER JOIN plan_categories pc ON pl.category_id = pc.id
      WHERE s.user_id = ?
        AND (
          (s.status = 'active' AND s.start_date <= CURRENT_DATE AND s.end_date >= CURRENT_DATE)
          OR s.status = 'queued'
        )
      ORDER BY s.start_date ASC
    `;

    const [rows] = await connection.query(query, [Number(memberUserId)]);
    return rows.map((row) => ({
      subscriptionId: Number(row.subscription_id),
      planId: Number(row.plan_id),
      planName: row.plan_name,
      categoryName: row.category_name,
      startDate: row.start_date,
      endDate: row.end_date,
      status: row.status,
      finalAmount: Number(row.final_amount),
      currency: row.currency,
      daysRemaining: Number(row.days_remaining),
    }));
  },

  /**
   * Retrieve the nearest expiring active subscription for a member.
   * Returns the active pass with the earliest end_date that hasn't expired yet.
   */
  async getMemberNearestExpiration(memberUserId, connection = pool) {
    const query = `
      SELECT
        s.id AS subscription_id,
        pl.name AS plan_name,
        s.end_date,
        GREATEST(0, DATEDIFF(s.end_date, CURRENT_DATE)) AS days_remaining
      FROM subscriptions s
      INNER JOIN plans pl ON s.plan_id = pl.id
      WHERE s.user_id = ?
        AND s.status = 'active'
        AND s.start_date <= CURRENT_DATE
        AND s.end_date >= CURRENT_DATE
      ORDER BY s.end_date ASC
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [Number(memberUserId)]);
    return rows[0]
      ? {
          subscriptionId: Number(rows[0].subscription_id),
          planName: rows[0].plan_name,
          endDate: rows[0].end_date,
          daysRemaining: Number(rows[0].days_remaining),
        }
      : null;
  },

  /**
   * Retrieve recent payment receipts for a specific member.
   * Scoped strictly to the authenticated member's user ID.
   */
  async getMemberRecentPayments(memberUserId, limit = 5, connection = pool) {
    const query = `
      SELECT
        p.id AS payment_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_status,
        p.payment_date,
        p.transaction_reference,
        pl.name AS plan_name
      FROM payments p
      INNER JOIN subscriptions s ON p.subscription_id = s.id
      INNER JOIN plans pl ON s.plan_id = pl.id
      WHERE p.user_id = ?
      ORDER BY p.payment_date DESC
      LIMIT ?
    `;

    const [rows] = await connection.query(query, [Number(memberUserId), Number(limit)]);
    return rows;
  },

  /**
   * Calculate profile completeness for a member.
   * Checks which optional fields are filled in member_profiles.
   * Returns field-level completion status and overall percentage.
   */
  async getMemberProfileCompleteness(memberUserId, connection = pool) {
    const query = `
      SELECT
        u.phone,
        mp.date_of_birth,
        mp.gender,
        mp.emergency_contact_name,
        mp.emergency_contact_phone,
        mp.health_conditions
      FROM users u
      LEFT JOIN member_profiles mp ON mp.user_id = u.id
      WHERE u.id = ? AND u.role = 'member' AND u.deleted_at IS NULL
    `;

    const [rows] = await connection.query(query, [Number(memberUserId)]);

    if (!rows[0]) {
      return {
        completedFields: 0,
        totalFields: 6,
        percentage: 0,
        fields: {
          phone: false,
          dateOfBirth: false,
          gender: false,
          emergencyContactName: false,
          emergencyContactPhone: false,
          healthConditions: false,
        },
      };
    }

    const row = rows[0];
    const fields = {
      phone: row.phone !== null && row.phone !== '',
      dateOfBirth: row.date_of_birth !== null,
      gender: row.gender !== null,
      emergencyContactName: row.emergency_contact_name !== null && row.emergency_contact_name !== '',
      emergencyContactPhone: row.emergency_contact_phone !== null && row.emergency_contact_phone !== '',
      healthConditions: row.health_conditions !== null && row.health_conditions !== '',
    };

    const totalFields = Object.keys(fields).length;
    const completedFields = Object.values(fields).filter(Boolean).length;
    const percentage = Math.round((completedFields / totalFields) * 100);

    return {
      completedFields,
      totalFields,
      percentage,
      fields,
    };
  },
};

export default dashboardRepository;
