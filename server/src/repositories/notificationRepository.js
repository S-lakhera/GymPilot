import { pool } from '../config/db.js';

export const notificationRepository = {
  /**
   * Create a new notification record idempotently via event_key.
   * If a notification with event_key already exists, the insert is gracefully ignored
   * and the existing record ID is retained.
   */
  async create(
    {
      userId,
      type,
      title,
      message,
      eventKey = null,
      isRead = false,
      actionUrl = null,
      metadata = null,
    },
    connection = pool
  ) {
    const serializedMetadata = metadata ? JSON.stringify(metadata) : null;

    const [result] = await connection.query(
      `INSERT INTO notifications (
        user_id, type, title, message, event_key, is_read, action_url, metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        id = LAST_INSERT_ID(id)`,
      [
        userId,
        type,
        title,
        message,
        eventKey || null,
        Boolean(isRead),
        actionUrl || null,
        serializedMetadata,
      ]
    );

    const insertedId = result.insertId;
    return this.findById(insertedId, connection);
  },

  /**
   * Find a notification by its primary key ID.
   */
  async findById(id, connection = pool) {
    const [rows] = await connection.query(
      `SELECT 
        id,
        user_id AS userId,
        type,
        title,
        message,
        event_key AS eventKey,
        is_read AS isRead,
        action_url AS actionUrl,
        metadata,
        created_at AS createdAt
      FROM notifications
      WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) return null;
    const n = rows[0];
    return {
      ...n,
      isRead: Boolean(n.isRead),
      metadata: typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata,
    };
  },

  /**
   * Find notifications for a user with pagination and optional unread filter.
   */
  async findByUserId(
    userId,
    { limit = 20, offset = 0, unreadOnly = false } = {},
    connection = pool
  ) {
    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (unreadOnly) {
      whereClause += ' AND is_read = FALSE';
    }

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM notifications ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);

    const [rows] = await connection.query(
      `SELECT 
        id,
        user_id AS userId,
        type,
        title,
        message,
        event_key AS eventKey,
        is_read AS isRead,
        action_url AS actionUrl,
        metadata,
        created_at AS createdAt
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
    );

    const notifications = rows.map((n) => ({
      ...n,
      isRead: Boolean(n.isRead),
      metadata: typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata,
    }));

    return {
      notifications,
      total,
      limit: Number(limit),
      offset: Number(offset),
    };
  },

  /**
   * Get unread notifications count for a user.
   */
  async getUnreadCount(userId, connection = pool) {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return Number(rows[0]?.count || 0);
  },

  /**
   * Mark a single notification as read (scoped to the owning user for security).
   */
  async markAsRead(notificationId, userId, connection = pool) {
    const [result] = await connection.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },

  /**
   * Mark all unread notifications as read for a user.
   */
  async markAllAsRead(userId, connection = pool) {
    const [result] = await connection.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );
    return result.affectedRows;
  },

  /**
   * Delete a notification (scoped to the owning user).
   */
  async delete(notificationId, userId, connection = pool) {
    const [result] = await connection.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },
};

export default notificationRepository;
