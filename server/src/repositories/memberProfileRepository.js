import { pool } from '../config/db.js';

export const memberProfileRepository = {
  /**
   * Create a member profile record (atomic with member user creation).
   */
  async create({ userId, dateOfBirth = null, gender = null, emergencyContactName = null, emergencyContactPhone = null, healthConditions = null }, connection = pool) {
    const [result] = await connection.query(
      `INSERT INTO member_profiles (user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, health_conditions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, dateOfBirth, gender, emergencyContactName, emergencyContactPhone, healthConditions]
    );
    return result.insertId;
  },

  /**
   * Find a member profile by user ID.
   */
  async findByUserId(userId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, user_id, date_of_birth, gender, emergency_contact_name, emergency_contact_phone, health_conditions, created_at, updated_at
       FROM member_profiles
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  /**
   * Update member profile fields.
   */
  async updateByUserId(userId, { dateOfBirth, gender, emergencyContactName, emergencyContactPhone, healthConditions }, connection = pool) {
    const updates = [];
    const values = [];

    if (dateOfBirth !== undefined) {
      updates.push('date_of_birth = ?');
      values.push(dateOfBirth || null);
    }
    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender || null);
    }
    if (emergencyContactName !== undefined) {
      updates.push('emergency_contact_name = ?');
      values.push(emergencyContactName ? emergencyContactName.trim() : null);
    }
    if (emergencyContactPhone !== undefined) {
      updates.push('emergency_contact_phone = ?');
      values.push(emergencyContactPhone ? emergencyContactPhone.trim() : null);
    }
    if (healthConditions !== undefined) {
      updates.push('health_conditions = ?');
      values.push(healthConditions ? healthConditions.trim() : null);
    }

    if (updates.length === 0) return false;

    values.push(userId);
    const [result] = await connection.query(
      `UPDATE member_profiles SET ${updates.join(', ')} WHERE user_id = ?`,
      values
    );
    return result.affectedRows > 0;
  },
};

export default memberProfileRepository;

