import { pool } from '../config/db.js';

export const trainerRepository = {
  /**
   * Create trainer profile record linked 1:1 to a user.
   */
  async createProfile(
    { userId, gender = 'male', specialization, experienceYears = 0, certification = null, bio = null, monthlySalary = null, maxClients = 10 },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO trainer_profiles (user_id, gender, specialization, experience_years, certification, bio, monthly_salary, max_clients)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        gender || 'male',
        specialization.trim(),
        experienceYears,
        certification ? certification.trim() : null,
        bio ? bio.trim() : null,
        monthlySalary !== null && monthlySalary !== undefined ? monthlySalary : null,
        Number(maxClients) || 10,
      ]
    );

    return {
      id: result.insertId,
      userId,
      gender: gender || 'male',
      specialization: specialization.trim(),
      experienceYears,
      certification: certification ? certification.trim() : null,
      bio: bio ? bio.trim() : null,
      monthlySalary: monthlySalary !== null && monthlySalary !== undefined ? Number(monthlySalary) : null,
      maxClients: Number(maxClients) || 10,
    };
  },

  /**
   * Find trainer with user account details by user ID.
   * Supports row-level locking (FOR UPDATE) inside ACID transactions.
   */
  async findByUserId(userId, connection = pool, includeDeleted = false, forUpdate = false) {
    const deletedCondition = includeDeleted ? '' : 'AND u.deleted_at IS NULL';
    const lockClause = forUpdate ? 'FOR UPDATE' : '';
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        u.deleted_at,
        tp.id AS profile_id,
        tp.gender,
        tp.specialization,
        tp.experience_years,
        tp.certification,
        tp.bio,
        tp.monthly_salary,
        tp.max_clients
      FROM users u
      INNER JOIN trainer_profiles tp ON u.id = tp.user_id
      WHERE u.id = ? AND u.role = 'trainer' ${deletedCondition}
      ${lockClause}
    `;

    const [rows] = await connection.query(query, [userId]);
    return rows[0] || null;
  },

  /**
   * Update trainer profile fields.
   */
  async updateProfileByUserId(userId, updateData, connection = pool) {
    const fields = [];
    const values = [];

    if (updateData.gender !== undefined) {
      fields.push('gender = ?');
      values.push(updateData.gender);
    }
    if (updateData.specialization !== undefined) {
      fields.push('specialization = ?');
      values.push(updateData.specialization.trim());
    }
    if (updateData.experienceYears !== undefined) {
      fields.push('experience_years = ?');
      values.push(Number(updateData.experienceYears));
    }
    if (updateData.certification !== undefined) {
      fields.push('certification = ?');
      values.push(updateData.certification ? updateData.certification.trim() : null);
    }
    if (updateData.bio !== undefined) {
      fields.push('bio = ?');
      values.push(updateData.bio ? updateData.bio.trim() : null);
    }
    if (updateData.monthlySalary !== undefined) {
      fields.push('monthly_salary = ?');
      values.push(updateData.monthlySalary !== null ? Number(updateData.monthlySalary) : null);
    }
    if (updateData.maxClients !== undefined) {
      fields.push('max_clients = ?');
      values.push(Number(updateData.maxClients) || 10);
    }

    if (fields.length === 0) {
      return this.findByUserId(userId, connection, true);
    }

    values.push(userId);
    const query = `UPDATE trainer_profiles SET ${fields.join(', ')} WHERE user_id = ?`;
    await connection.query(query, values);

    return this.findByUserId(userId, connection, true);
  },

  /**
   * Find all trainers with pagination, search, and sorting.
   */
  async findAll(
    {
      page = 1,
      limit = 10,
      search = '',
      isActive = null,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = {},
    connection = pool
  ) {
    const offset = (page - 1) * limit;
    const whereClauses = ["u.role = 'trainer'"];
    const params = [];

    if (isActive !== null && isActive !== undefined) {
      whereClauses.push('u.is_active = ?');
      params.push(Boolean(isActive));
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push(
        '(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR tp.specialization LIKE ?)'
      );
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Allowed sort columns to prevent SQL injection
    const allowedSortFields = {
      id: 'u.id',
      first_name: 'u.first_name',
      last_name: 'u.last_name',
      email: 'u.email',
      specialization: 'tp.specialization',
      experience_years: 'tp.experience_years',
      created_at: 'u.created_at',
    };

    const sortColumn = allowedSortFields[sortBy] || 'u.created_at';
    const orderDirection = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN trainer_profiles tp ON u.id = tp.user_id
      ${whereSql}
    `;
    const [countRows] = await connection.query(countQuery, params);
    const total = Number(countRows[0].total);

    // Data query
    const dataQuery = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.is_active,
        u.created_at,
        u.updated_at,
        u.deleted_at,
        tp.id AS profile_id,
        tp.gender,
        tp.specialization,
        tp.experience_years,
        tp.certification,
        tp.bio,
        tp.monthly_salary,
        tp.max_clients
      FROM users u
      INNER JOIN trainer_profiles tp ON u.id = tp.user_id
      ${whereSql}
      ORDER BY ${sortColumn} ${orderDirection}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await connection.query(dataQuery, [...params, Number(limit), Number(offset)]);

    return {
      trainers: rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },
};

