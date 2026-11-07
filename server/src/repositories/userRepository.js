import { pool } from '../config/db.js';

export const userRepository = {
  /**
   * Find an active user by ID (optionally including soft-deleted users for Admin operations).
   */
  async findById(id, connection = pool, includeDeleted = false) {
    const query = includeDeleted
      ? `SELECT id, email, first_name, last_name, phone, role, is_active, created_at, updated_at, deleted_at
         FROM users
         WHERE id = ?`
      : `SELECT id, email, first_name, last_name, phone, role, is_active, created_at, updated_at, deleted_at
         FROM users
         WHERE id = ? AND deleted_at IS NULL`;

    const [rows] = await connection.query(query, [id]);
    return rows[0] || null;
  },

  /**
   * Find an active user by email (excluding soft-deleted users).
   */
  async findByEmail(email, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, email, first_name, last_name, phone, role, is_active, created_at, updated_at, deleted_at
       FROM users
       WHERE email = ? AND deleted_at IS NULL`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by email including their password hash for authentication.
   * Includes deactivated users so the service can return a specific deactivated account error.
   */
  async findWithPasswordByEmail(email, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at, deleted_at
       FROM users
       WHERE email = ?`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by ID including password hash (used for password changes).
   */
  async findWithPasswordById(id, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, email, password_hash, first_name, last_name, phone, role, is_active, created_at, updated_at, deleted_at
       FROM users
       WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user record.
   */
  async create({ email, passwordHash, firstName, lastName, phone, role = 'member', isActive = true }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        email.toLowerCase().trim(),
        passwordHash,
        firstName.trim(),
        lastName.trim(),
        phone ? phone.trim() : null,
        role,
        isActive,
      ]
    );
    return result.insertId;
  },

  /**
   * Update core user fields (first_name, last_name, phone).
   */
  async update(id, { firstName, lastName, phone }, connection = pool) {
    const updates = [];
    const values = [];

    if (firstName !== undefined) {
      updates.push('first_name = ?');
      values.push(firstName.trim());
    }
    if (lastName !== undefined) {
      updates.push('last_name = ?');
      values.push(lastName.trim());
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone ? phone.trim() : null);
    }

    if (updates.length === 0) return false;

    values.push(id);
    const [result] = await connection.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    return result.affectedRows > 0;
  },

  /**
   * Update user's password hash.
   */
  async updatePassword(id, passwordHash, connection = pool) {
    const [result] = await connection.query(
      `UPDATE users SET password_hash = ? WHERE id = ?`,
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Soft-deactivate or reactivate a user account.
   */
  async updateStatus(id, isActive, connection = pool) {
    const deletedAt = isActive ? null : new Date();
    const [result] = await connection.query(
      `UPDATE users SET is_active = ?, deleted_at = ? WHERE id = ?`,
      [isActive, deletedAt, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Admin paginated member listing with search, filtering, and sorting.
   */
  async findAllMembers({ page = 1, limit = 10, search = '', status = 'all', sortBy = 'created_at', sortOrder = 'DESC' }, connection = pool) {
    const conditions = ["role = 'member'"];
    const params = [];

    if (search && search.trim() !== '') {
      conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    if (status === 'active') {
      conditions.push('is_active = TRUE AND deleted_at IS NULL');
    } else if (status === 'inactive') {
      conditions.push('(is_active = FALSE OR deleted_at IS NOT NULL)');
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // 1. Get total count
    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM users ${whereClause}`,
      params
    );
    const totalRecords = countRows[0].total;

    // 2. Fetch paginated records
    const allowedSortFields = ['id', 'first_name', 'last_name', 'email', 'created_at', 'is_active'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (page - 1) * limit;
    const [rows] = await connection.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.created_at, u.updated_at, u.deleted_at,
              mp.date_of_birth, mp.gender, mp.emergency_contact_name, mp.emergency_contact_phone, mp.health_conditions
       FROM users u
       LEFT JOIN member_profiles mp ON u.id = mp.user_id
       ${whereClause}
       ORDER BY u.${safeSortBy} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      members: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalRecords,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  },

  /**
   * Acquire a pessimistic write lock on the user's row.
   * Serializes concurrent operations for this specific member.
   */
  async lockUser(id, connection) {
    const [rows] = await connection.query(
      `SELECT id FROM users WHERE id = ? FOR UPDATE`,
      [id]
    );
    return rows[0] || null;
  },
};

export default userRepository;

