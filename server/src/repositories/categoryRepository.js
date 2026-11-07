import { pool } from "../config/db.js";

export const categoryRepository = {
  /**
   * Create a new plan category.
   */
  async create(
    { name, description = null, isActive = true },
    connection = pool,
  ) {
    const [result] = await connection.query(
      `INSERT INTO plan_categories (name, description, is_active)
       VALUES (?, ?, ?)`,
      [name.trim(), description ? description.trim() : null, Boolean(isActive)],
    );

    return {
      id: result.insertId,
      name: name.trim(),
      description: description ? description.trim() : null,
      isActive: Boolean(isActive),
    };
  },

  /**
   * Find a category by primary key ID.
   */
  async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, name, description, is_active, created_at, updated_at
       FROM plan_categories
       WHERE id = ?`,
      [id],
    );
    return rows[0] || null;
  },

  /**
   * Find a category by unique name (case-insensitive).
   */
  async findByName(name, connection = pool) {
    const [rows] = await connection.query(
      `SELECT id, name, description, is_active, created_at, updated_at
       FROM plan_categories
       WHERE LOWER(name) = LOWER(?)`,
      [name.trim()],
    );
    return rows[0] || null;
  },

  /**
   * List all categories with optional filtering by active status and search.
   */
  async findAll({ isActive = null, search = "" } = {}, connection = pool) {
    const whereClauses = [];
    const params = [];

    if (isActive !== null && isActive !== undefined) {
      whereClauses.push("is_active = ?");
      params.push(Boolean(isActive));
    }

    if (search && search.trim()) {
      whereClauses.push("(name LIKE ? OR description LIKE ?)");
      const term = `%${search.trim()}%`;
      params.push(term, term);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
    const query = `
      SELECT id, name, description, is_active, created_at, updated_at
      FROM plan_categories
      ${whereSql}
      ORDER BY name ASC
    `;

    const [rows] = await connection.query(query, params);
    return rows;
  },

  /**
   * Update category fields.
   */
  async update(id, updateData, connection = pool) {
    const fields = [];
    const values = [];

    if (updateData.name !== undefined) {
      fields.push("name = ?");
      values.push(updateData.name.trim());
    }
    if (updateData.description !== undefined) {
      fields.push("description = ?");
      values.push(
        updateData.description ? updateData.description.trim() : null,
      );
    }
    if (updateData.isActive !== undefined) {
      fields.push("is_active = ?");
      values.push(Boolean(updateData.isActive));
    }

    if (fields.length === 0) {
      return this.findById(id, connection);
    }

    values.push(id);
    const query = `UPDATE plan_categories SET ${fields.join(", ")} WHERE id = ?`;
    await connection.query(query, values);

    return this.findById(id, connection);
  },

  /**
   * Count active or total plans referencing this category (referential safety check).
   */
  async countPlansByCategoryId(categoryId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total_plans
       FROM plans
       WHERE category_id = ?`,
      [categoryId],
    );
    return Number(rows[0].total_plans);
  },
};
