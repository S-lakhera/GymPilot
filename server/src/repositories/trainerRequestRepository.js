import { pool } from '../config/db.js';

export const trainerRequestRepository = {
  /**
   * Create a new trainer assignment request.
   */
  async create({ memberId, trainerId, notes = null }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO trainer_assignment_requests (member_id, trainer_id, notes, status, requested_at)
       VALUES (?, ?, ?, 'PENDING', NOW())`,
      [memberId, trainerId, notes ? notes.trim() : null]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Find request by ID with member and trainer user details.
   */
  async findById(id, connection = pool) {
    const query = `
      SELECT 
        tar.id,
        tar.member_id,
        tar.trainer_id,
        tar.notes,
        tar.status,
        tar.requested_at,
        tar.reviewed_by_id,
        tar.reviewed_at,
        tar.rejection_reason,
        tar.created_at,
        tar.updated_at,
        -- Member details
        um.first_name AS member_first_name,
        um.last_name AS member_last_name,
        um.email AS member_email,
        um.phone AS member_phone,
        mp.health_conditions,
        -- Trainer details
        ut.first_name AS trainer_first_name,
        ut.last_name AS trainer_last_name,
        ut.email AS trainer_email,
        tp.gender AS trainer_gender,
        tp.specialization AS trainer_specialization,
        -- Reviewer details
        ur.first_name AS reviewer_first_name,
        ur.last_name AS reviewer_last_name
      FROM trainer_assignment_requests tar
      INNER JOIN users um ON tar.member_id = um.id
      LEFT JOIN member_profiles mp ON um.id = mp.user_id
      INNER JOIN users ut ON tar.trainer_id = ut.id
      LEFT JOIN trainer_profiles tp ON ut.id = tp.user_id
      LEFT JOIN users ur ON tar.reviewed_by_id = ur.id
      WHERE tar.id = ?
    `;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Find any active PENDING request for a member.
   */
  async findPendingByMemberId(memberId, connection = pool) {
    const query = `
      SELECT 
        tar.*,
        ut.first_name AS trainer_first_name,
        ut.last_name AS trainer_last_name,
        tp.gender AS trainer_gender,
        tp.specialization AS trainer_specialization
      FROM trainer_assignment_requests tar
      INNER JOIN users ut ON tar.trainer_id = ut.id
      LEFT JOIN trainer_profiles tp ON ut.id = tp.user_id
      WHERE tar.member_id = ? AND tar.status = 'PENDING'
      ORDER BY tar.id DESC
      LIMIT 1
    `;

    const [rows] = await connection.query(query, [memberId]);
    return rows[0] || null;
  },

  /**
   * Update request status (e.g. APPROVED, REJECTED, CANCELLED).
   */
  async updateStatus(id, { status, reviewedById = null, rejectionReason = null }, connection = pool) {
    const query = `
      UPDATE trainer_assignment_requests
      SET 
        status = ?,
        reviewed_by_id = ?,
        reviewed_at = NOW(),
        rejection_reason = ?
      WHERE id = ?
    `;

    await connection.query(query, [
      status,
      reviewedById,
      rejectionReason ? rejectionReason.trim() : null,
      id,
    ]);

    return this.findById(id, connection);
  },

  /**
   * Cancel a request by the member themselves.
   */
  async cancelByMember(id, memberId, connection = pool) {
    const query = `
      UPDATE trainer_assignment_requests
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ? AND member_id = ? AND status = 'PENDING'
    `;

    const [result] = await connection.query(query, [id, memberId]);
    if (result.affectedRows === 0) return null;
    return this.findById(id, connection);
  },

  /**
   * Find all requests with optional status, trainer, or member filters.
   */
  async findAll({ status = null, trainerId = null, memberId = null, page = 1, limit = 20 } = {}, connection = pool) {
    const offset = (page - 1) * limit;
    const whereClauses = [];
    const params = [];

    if (status) {
      whereClauses.push('tar.status = ?');
      params.push(status);
    }
    if (trainerId) {
      whereClauses.push('tar.trainer_id = ?');
      params.push(trainerId);
    }
    if (memberId) {
      whereClauses.push('tar.member_id = ?');
      params.push(memberId);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM trainer_assignment_requests tar
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    const dataQuery = `
      SELECT 
        tar.id,
        tar.member_id,
        tar.trainer_id,
        tar.notes,
        tar.status,
        tar.requested_at,
        tar.reviewed_by_id,
        tar.reviewed_at,
        tar.rejection_reason,
        tar.created_at,
        tar.updated_at,
        um.first_name AS member_first_name,
        um.last_name AS member_last_name,
        um.email AS member_email,
        um.phone AS member_phone,
        ut.first_name AS trainer_first_name,
        ut.last_name AS trainer_last_name,
        tp.gender AS trainer_gender,
        tp.specialization AS trainer_specialization
      FROM trainer_assignment_requests tar
      INNER JOIN users um ON tar.member_id = um.id
      INNER JOIN users ut ON tar.trainer_id = ut.id
      LEFT JOIN trainer_profiles tp ON ut.id = tp.user_id
      ${whereSql}
      ORDER BY tar.id DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      requests: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};

export default trainerRequestRepository;
