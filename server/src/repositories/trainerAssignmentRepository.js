import { pool } from '../config/db.js';

export const trainerAssignmentRepository = {
  /**
   * Create a new trainer-member assignment.
   */
  async create(
    { memberId, trainerId, requestId = null, assignedById, startDate = null, notes = null },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO trainer_member_assignments 
       (member_id, trainer_id, request_id, assigned_by_id, start_date, status, notes)
       VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_DATE), 'ACTIVE', ?)`,
      [memberId, trainerId, requestId, assignedById, startDate, notes ? notes.trim() : null]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Find assignment by ID with full member, trainer, and reviewer details.
   */
  async findById(id, connection = pool) {
    const query = `
      SELECT 
        tma.id,
        tma.member_id,
        tma.trainer_id,
        tma.request_id,
        tma.assigned_by_id,
        tma.start_date,
        tma.end_date,
        tma.status,
        tma.paused_at,
        tma.grace_period_ends_at,
        tma.terminated_at,
        tma.termination_reason,
        tma.notes,
        tma.created_at,
        tma.updated_at,
        -- Member details
        um.first_name AS member_first_name,
        um.last_name AS member_last_name,
        um.email AS member_email,
        um.phone AS member_phone,
        mp.date_of_birth AS member_dob,
        mp.gender AS member_gender,
        mp.emergency_contact_name,
        mp.emergency_contact_phone,
        mp.health_conditions,
        -- Trainer details
        ut.first_name AS trainer_first_name,
        ut.last_name AS trainer_last_name,
        ut.email AS trainer_email,
        ut.phone AS trainer_phone,
        tp.gender AS trainer_gender,
        tp.specialization AS trainer_specialization,
        tp.experience_years AS trainer_experience_years,
        tp.certification AS trainer_certification,
        tp.max_clients AS trainer_max_clients,
        -- Assigned By (Admin) details
        ua.first_name AS assigned_by_first_name,
        ua.last_name AS assigned_by_last_name
      FROM trainer_member_assignments tma
      INNER JOIN users um ON tma.member_id = um.id
      LEFT JOIN member_profiles mp ON um.id = mp.user_id
      INNER JOIN users ut ON tma.trainer_id = ut.id
      LEFT JOIN trainer_profiles tp ON ut.id = tp.user_id
      INNER JOIN users ua ON tma.assigned_by_id = ua.id
      WHERE tma.id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Find current active or paused assignment for a member.
   * Supports row-level locking (FOR UPDATE) within transaction boundaries.
   */
  async findActiveByMemberId(memberId, connection = pool, forUpdate = false) {
    const lockClause = forUpdate ? 'FOR UPDATE' : '';
    const query = `
      SELECT 
        tma.*,
        ut.first_name AS trainer_first_name,
        ut.last_name AS trainer_last_name,
        ut.email AS trainer_email,
        ut.phone AS trainer_phone,
        tp.gender AS trainer_gender,
        tp.specialization AS trainer_specialization,
        tp.experience_years AS trainer_experience_years,
        tp.certification AS trainer_certification,
        tp.bio AS trainer_bio
      FROM trainer_member_assignments tma
      INNER JOIN users ut ON tma.trainer_id = ut.id
      LEFT JOIN trainer_profiles tp ON ut.id = tp.user_id
      WHERE tma.member_id = ? AND tma.status IN ('ACTIVE', 'PAUSED')
      ORDER BY tma.id DESC
      LIMIT 1
      ${lockClause}
    `;

    const [rows] = await connection.query(query, [memberId]);
    return rows[0] || null;
  },

  /**
   * Get total count of active/paused clients currently assigned to a trainer.
   */
  async getActiveClientCount(trainerId, connection = pool) {
    const query = `
      SELECT COUNT(*) AS active_count
      FROM trainer_member_assignments
      WHERE trainer_id = ? AND status IN ('ACTIVE', 'PAUSED')
    `;

    const [rows] = await connection.query(query, [trainerId]);
    return Number(rows[0]?.active_count || 0);
  },

  /**
   * List all trainers with capacity and current active client counts.
   */
  async listTrainersWithCapacity(connection = pool) {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.is_active,
        tp.gender,
        tp.specialization,
        tp.experience_years,
        tp.certification,
        tp.bio,
        tp.max_clients,
        COUNT(CASE WHEN tma.status IN ('ACTIVE', 'PAUSED') THEN 1 END) AS active_clients_count,
        CASE 
          WHEN COUNT(CASE WHEN tma.status IN ('ACTIVE', 'PAUSED') THEN 1 END) >= tp.max_clients THEN 1 
          ELSE 0 
        END AS is_at_capacity
      FROM users u
      INNER JOIN trainer_profiles tp ON u.id = tp.user_id
      LEFT JOIN trainer_member_assignments tma ON u.id = tma.trainer_id
      WHERE u.role = 'trainer' AND u.is_active = TRUE AND u.deleted_at IS NULL
      GROUP BY u.id, tp.id
      ORDER BY active_clients_count ASC, u.first_name ASC
    `;

    const [rows] = await connection.query(query);
    return rows.map((r) => ({
      ...r,
      active_clients_count: Number(r.active_clients_count),
      is_at_capacity: Boolean(r.is_at_capacity),
    }));
  },

  /**
   * List assignments assigned to a specific trainer (Trainer Client Roster).
   */
  async listAssignmentsByTrainer(
    trainerId,
    { status = null, page = 1, limit = 20 } = {},
    connection = pool
  ) {
    const offset = (page - 1) * limit;
    const whereClauses = ['tma.trainer_id = ?'];
    const params = [trainerId];

    if (status) {
      whereClauses.push('tma.status = ?');
      params.push(status);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM trainer_member_assignments tma
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    const dataQuery = `
      SELECT 
        tma.id,
        tma.member_id,
        tma.trainer_id,
        tma.start_date,
        tma.end_date,
        tma.status,
        tma.paused_at,
        tma.grace_period_ends_at,
        tma.terminated_at,
        tma.termination_reason,
        tma.notes,
        tma.created_at,
        um.first_name AS member_first_name,
        um.last_name AS member_last_name,
        um.email AS member_email,
        um.phone AS member_phone,
        mp.date_of_birth AS member_dob,
        mp.gender AS member_gender,
        mp.emergency_contact_name,
        mp.emergency_contact_phone,
        mp.health_conditions,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', s.id,
              'plan_name', p.name,
              'category_name', pc.name,
              'end_date', s.end_date,
              'status', s.status
            )
          )
          FROM subscriptions s
          INNER JOIN plans p ON s.plan_id = p.id
          INNER JOIN plan_categories pc ON p.category_id = pc.id
          WHERE s.user_id = tma.member_id AND s.status = 'active'
        ) AS active_subscriptions
      FROM trainer_member_assignments tma
      INNER JOIN users um ON tma.member_id = um.id
      LEFT JOIN member_profiles mp ON um.id = mp.user_id
      ${whereSql}
      ORDER BY 
        CASE tma.status 
          WHEN 'ACTIVE' THEN 1 
          WHEN 'PAUSED' THEN 2 
          ELSE 3 
        END,
        tma.start_date DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      assignments: rows.map((r) => ({
        ...r,
        active_subscriptions: typeof r.active_subscriptions === 'string'
          ? JSON.parse(r.active_subscriptions)
          : (r.active_subscriptions || []),
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Find all assignments for Admin management with search and filters.
   */
  async listAllAssignments(
    { status = null, trainerId = null, memberId = null, search = '', page = 1, limit = 20 } = {},
    connection = pool
  ) {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push('tma.status = ?');
      params.push(status);
    }
    if (trainerId) {
      whereClauses.push('tma.trainer_id = ?');
      params.push(trainerId);
    }
    if (memberId) {
      whereClauses.push('tma.member_id = ?');
      params.push(memberId);
    }
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push(
        '(um.first_name LIKE ? OR um.last_name LIKE ? OR um.email LIKE ? OR ut.first_name LIKE ? OR ut.last_name LIKE ?)'
      );
      params.push(term, term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM trainer_member_assignments tma
      INNER JOIN users um ON tma.member_id = um.id
      INNER JOIN users ut ON tma.trainer_id = ut.id
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    const dataQuery = `
      SELECT 
        tma.id,
        tma.member_id,
        tma.trainer_id,
        tma.request_id,
        tma.assigned_by_id,
        tma.start_date,
        tma.end_date,
        tma.status,
        tma.paused_at,
        tma.grace_period_ends_at,
        tma.terminated_at,
        tma.termination_reason,
        tma.notes,
        tma.created_at,
        um.first_name AS member_first_name,
        um.last_name AS member_last_name,
        um.email AS member_email,
        ut.first_name AS trainer_first_name,
        ut.last_name AS trainer_last_name,
        tp.specialization AS trainer_specialization,
        ua.first_name AS assigned_by_first_name,
        ua.last_name AS assigned_by_last_name
      FROM trainer_member_assignments tma
      INNER JOIN users um ON tma.member_id = um.id
      INNER JOIN users ut ON tma.trainer_id = ut.id
      LEFT JOIN trainer_profiles tp ON ut.id = tp.user_id
      INNER JOIN users ua ON tma.assigned_by_id = ua.id
      ${whereSql}
      ORDER BY 
        CASE tma.status 
          WHEN 'ACTIVE' THEN 1 
          WHEN 'PAUSED' THEN 2 
          ELSE 3 
        END,
        tma.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      assignments: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  /**
   * Terminate an assignment.
   */
  async terminateAssignment(
    id,
    { terminationReason = 'ADMIN_TERMINATED', notes = null } = {},
    connection = pool
  ) {
    const query = `
      UPDATE trainer_member_assignments
      SET 
        status = 'TERMINATED',
        end_date = CURRENT_DATE,
        terminated_at = NOW(),
        termination_reason = ?,
        notes = COALESCE(?, notes),
        updated_at = NOW()
      WHERE id = ?
    `;

    await connection.query(query, [terminationReason, notes, id]);
    return this.findById(id, connection);
  },

  /**
   * Pause an assignment upon pass expiration with 10-day grace period.
   */
  async pauseAssignment(id, { gracePeriodDays = 10 } = {}, connection = pool) {
    const query = `
      UPDATE trainer_member_assignments
      SET 
        status = 'PAUSED',
        paused_at = NOW(),
        grace_period_ends_at = DATE_ADD(NOW(), INTERVAL ? DAY),
        updated_at = NOW()
      WHERE id = ? AND status = 'ACTIVE'
    `;

    await connection.query(query, [gracePeriodDays, id]);
    return this.findById(id, connection);
  },

  /**
   * Restore a PAUSED assignment back to ACTIVE upon pass renewal.
   */
  async restoreAssignment(id, connection = pool) {
    const query = `
      UPDATE trainer_member_assignments
      SET 
        status = 'ACTIVE',
        paused_at = NULL,
        grace_period_ends_at = NULL,
        updated_at = NOW()
      WHERE id = ? AND status = 'PAUSED'
    `;

    await connection.query(query, [id]);
    return this.findById(id, connection);
  },

  /**
   * Find assignments that are ACTIVE but the member has 0 active subscriptions.
   */
  async findActiveAssignmentsWithNoActivePasses(connection = pool) {
    const query = `
      SELECT tma.id, tma.member_id, tma.trainer_id
      FROM trainer_member_assignments tma
      WHERE tma.status = 'ACTIVE'
        AND NOT EXISTS (
          SELECT 1 FROM subscriptions s 
          WHERE s.user_id = tma.member_id 
            AND s.status = 'active'
            AND s.end_date >= CURRENT_DATE
        )
    `;

    const [rows] = await connection.query(query);
    return rows;
  },

  /**
   * Find assignments that are PAUSED and their 10-day grace period has elapsed.
   */
  async findExpiredGraceAssignments(connection = pool) {
    const query = `
      SELECT tma.id, tma.member_id, tma.trainer_id
      FROM trainer_member_assignments tma
      WHERE tma.status = 'PAUSED'
        AND tma.grace_period_ends_at IS NOT NULL
        AND tma.grace_period_ends_at <= NOW()
    `;

    const [rows] = await connection.query(query);
    return rows;
  },
};

export default trainerAssignmentRepository;
