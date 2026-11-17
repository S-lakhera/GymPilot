import { pool } from '../config/db.js';

/**
 * Attendance Repository
 * Encapsulates all raw SQL queries for attendance records, daily statistics,
 * streak tracking, and attendance logs.
 */
/**
 * Formats a Date or date string to local YYYY-MM-DD avoiding UTC offset shifts.
 *
 * @param {Date|string} d
 * @returns {string}
 */
function toLocalDateString(d) {
  if (!d) return '';
  if (typeof d === 'string') {
    return d.split('T')[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const attendanceRepository = {
  /**
   * Check if a member already has an open session today (check_in_time is today, check_out_time IS NULL).
   *
   * @param {number} memberId
   * @param {object} connection
   * @param {boolean} forUpdate - row locking for transaction serialization
   * @returns {Promise<object|null>}
   */
  async findOpenSessionToday(memberId, connection = pool, forUpdate = false) {
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await connection.query(
      `SELECT ar.*, u.first_name, u.last_name, u.email
       FROM attendance_records ar
       JOIN users u ON u.id = ar.member_id
       WHERE ar.member_id = ? 
         AND ar.status = 'CHECKED_IN'
         AND ar.check_out_time IS NULL
       LIMIT 1${lockClause}`,
      [memberId]
    );
    return rows[0] || null;
  },

  /**
   * Alias for open active session check across midnight boundary.
   */
  async findOpenSession(memberId, connection = pool, forUpdate = false) {
    return this.findOpenSessionToday(memberId, connection, forUpdate);
  },

  /**
   * Find attendance record by ID with joined member, staff, and pass details.
   *
   * @param {number} id
   * @param {object} connection
   * @param {boolean} forUpdate
   * @returns {Promise<object|null>}
   */
  async findById(id, connection = pool, forUpdate = false) {
    const lockClause = forUpdate ? ' FOR UPDATE' : '';
    const [rows] = await connection.query(
      `SELECT 
         ar.id,
         ar.member_id,
         ar.subscription_id,
         ar.check_in_time,
         ar.check_out_time,
         ar.duration_minutes,
         ar.recorded_by_id,
         ar.status,
         ar.pass_status_at_checkin,
         ar.override_note,
         ar.notes,
         ar.created_at,
         ar.updated_at,
         -- Member details
         um.first_name AS member_first_name,
         um.last_name AS member_last_name,
         um.email AS member_email,
         um.phone AS member_phone,
         -- Staff details
         ur.first_name AS recorded_by_first_name,
         ur.last_name AS recorded_by_last_name,
         -- Plan / Subscription details
         p.name AS plan_name,
         pc.name AS category_name
       FROM attendance_records ar
       INNER JOIN users um ON um.id = ar.member_id
       INNER JOIN users ur ON ur.id = ar.recorded_by_id
       LEFT JOIN subscriptions s ON s.id = ar.subscription_id
       LEFT JOIN plans p ON p.id = s.plan_id
       LEFT JOIN plan_categories pc ON pc.id = p.category_id
       WHERE ar.id = ?${lockClause}`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new attendance check-in record.
   *
   * @param {object} data
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async createCheckIn(
    {
      memberId,
      subscriptionId = null,
      checkInTime = null,
      recordedById,
      passStatusAtCheckin = 'ACTIVE_PASS',
      overrideNote = null,
      notes = null,
    },
    connection = pool
  ) {
    const [result] = await connection.query(
      `INSERT INTO attendance_records 
        (member_id, subscription_id, check_in_time, recorded_by_id, status, pass_status_at_checkin, override_note, notes)
       VALUES (?, ?, COALESCE(?, NOW()), ?, 'CHECKED_IN', ?, ?, ?)`,
      [
        memberId,
        subscriptionId,
        checkInTime,
        recordedById,
        passStatusAtCheckin,
        overrideNote ? overrideNote.trim() : null,
        notes ? notes.trim() : null,
      ]
    );

    return this.findById(result.insertId, connection);
  },

  /**
   * Update attendance record with check-out time and calculated duration.
   *
   * @param {number} id
   * @param {object} param1
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async updateCheckOut(id, { checkOutTime = null, durationMinutes, notes = null }, connection = pool) {
    await connection.query(
      `UPDATE attendance_records
       SET check_out_time = COALESCE(?, NOW()),
           duration_minutes = ?,
           status = 'CHECKED_OUT',
           notes = CASE WHEN ? IS NOT NULL THEN ? ELSE notes END
       WHERE id = ?`,
      [checkOutTime, durationMinutes, notes ? notes.trim() : null, notes ? notes.trim() : null, id]
    );

    return this.findById(id, connection);
  },

  /**
   * Admin correction: Update timestamps, notes, and duration of an attendance record.
   *
   * @param {number} id
   * @param {object} fields
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async updateRecord(id, { checkInTime, checkOutTime, durationMinutes, notes, status }, connection = pool) {
    const updates = [];
    const params = [];

    if (checkInTime !== undefined) {
      updates.push('check_in_time = ?');
      params.push(checkInTime);
    }
    if (checkOutTime !== undefined) {
      updates.push('check_out_time = ?');
      params.push(checkOutTime);
    }
    if (durationMinutes !== undefined) {
      updates.push('duration_minutes = ?');
      params.push(durationMinutes);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes ? notes.trim() : null);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length > 0) {
      params.push(id);
      await connection.query(
        `UPDATE attendance_records SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return this.findById(id, connection);
  },

  /**
   * Admin deletion: Delete an attendance record.
   *
   * @param {number} id
   * @param {object} connection
   * @returns {Promise<boolean>}
   */
  async deleteRecord(id, connection = pool) {
    const [result] = await connection.query(
      `DELETE FROM attendance_records WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  /**
   * List currently active sessions (in gym right now).
   *
   * @param {object} connection
   * @returns {Promise<Array>}
   */
  async getCurrentlyInGym(connection = pool) {
    const [rows] = await connection.query(
      `SELECT 
         ar.id,
         ar.member_id,
         ar.subscription_id,
         ar.check_in_time,
         ar.status,
         ar.pass_status_at_checkin,
         ar.override_note,
         ar.notes,
         TIMESTAMPDIFF(MINUTE, ar.check_in_time, NOW()) AS elapsed_minutes,
         um.first_name AS member_first_name,
         um.last_name AS member_last_name,
         um.email AS member_email,
         um.phone AS member_phone,
         p.name AS plan_name
       FROM attendance_records ar
       INNER JOIN users um ON um.id = ar.member_id
       LEFT JOIN subscriptions s ON s.id = ar.subscription_id
       LEFT JOIN plans p ON p.id = s.plan_id
       WHERE ar.status = 'CHECKED_IN'
         AND ar.check_out_time IS NULL
       ORDER BY ar.check_in_time DESC`
    );
    return rows;
  },

  /**
   * Get attendance logs with date filtering, search, and status.
   *
   * @param {object} options
   * @param {object} connection
   * @returns {Promise<{ records: Array, pagination: object }>}
   */
  async listAttendanceLogs(
    { date = null, startDate = null, endDate = null, search = '', status = '', page = 1, limit = 20 },
    connection = pool
  ) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const whereClauses = [];
    const params = [];

    if (date) {
      whereClauses.push('DATE(ar.check_in_time) = ?');
      params.push(date);
    } else if (startDate && endDate) {
      whereClauses.push('DATE(ar.check_in_time) BETWEEN ? AND ?');
      params.push(startDate, endDate);
    } else if (startDate) {
      whereClauses.push('DATE(ar.check_in_time) >= ?');
      params.push(startDate);
    } else if (endDate) {
      whereClauses.push('DATE(ar.check_in_time) <= ?');
      params.push(endDate);
    }

    if (status) {
      whereClauses.push('ar.status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClauses.push('(um.first_name LIKE ? OR um.last_name LIKE ? OR um.email LIKE ? OR um.phone LIKE ?)');
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total records
    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM attendance_records ar
       INNER JOIN users um ON um.id = ar.member_id
       ${whereSql}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Fetch paginated records
    const [records] = await connection.query(
      `SELECT 
         ar.id,
         ar.member_id,
         ar.subscription_id,
         ar.check_in_time,
         ar.check_out_time,
         ar.duration_minutes,
         ar.recorded_by_id,
         ar.status,
         ar.pass_status_at_checkin,
         ar.override_note,
         ar.notes,
         ar.created_at,
         um.first_name AS member_first_name,
         um.last_name AS member_last_name,
         um.email AS member_email,
         um.phone AS member_phone,
         ur.first_name AS recorded_by_first_name,
         ur.last_name AS recorded_by_last_name,
         p.name AS plan_name,
         pc.name AS category_name
       FROM attendance_records ar
       INNER JOIN users um ON um.id = ar.member_id
       INNER JOIN users ur ON ur.id = ar.recorded_by_id
       LEFT JOIN subscriptions s ON s.id = ar.subscription_id
       LEFT JOIN plans p ON p.id = s.plan_id
       LEFT JOIN plan_categories pc ON pc.id = p.category_id
       ${whereSql}
       ORDER BY ar.check_in_time DESC
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    return {
      records,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  },

  /**
   * Get 4 core metrics for Admin Attendance Dashboard.
   *
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async getTodayStats(connection = pool) {
    const [rows] = await connection.query(`
      SELECT
        COUNT(CASE WHEN status = 'CHECKED_IN' AND check_out_time IS NULL THEN 1 END) AS currently_in_gym,
        COUNT(CASE WHEN check_in_time >= CURDATE() AND check_in_time < CURDATE() + INTERVAL 1 DAY THEN 1 END) AS total_visits_today,
        COUNT(CASE WHEN status = 'CHECKED_OUT' AND check_in_time >= CURDATE() AND check_in_time < CURDATE() + INTERVAL 1 DAY THEN 1 END) AS completed_visits_today
      FROM attendance_records
      WHERE (status = 'CHECKED_IN' AND check_out_time IS NULL)
         OR (check_in_time >= CURDATE() AND check_in_time < CURDATE() + INTERVAL 1 DAY)
    `);

    return {
      currentlyInGym: Number(rows[0]?.currently_in_gym || 0),
      totalVisitsToday: Number(rows[0]?.total_visits_today || 0),
      completedVisitsToday: Number(rows[0]?.completed_visits_today || 0),
    };
  },

  /**
   * Get 7-day attendance trend (daily counts for past 7 days, including today).
   *
   * @param {number} days
   * @param {object} connection
   * @returns {Promise<Array<{ date: string, day: string, count: number }>>}
   */
  async getRecentTrend(days = 7, connection = pool) {
    const [rows] = await connection.query(`
      SELECT 
        DATE(check_in_time) AS log_date,
        COUNT(*) AS visit_count
      FROM attendance_records
      WHERE check_in_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(check_in_time)
      ORDER BY log_date ASC
    `, [days - 1]);

    const countMap = new Map();
    for (const r of rows) {
      const dStr = typeof r.log_date === 'string' ? r.log_date : r.log_date.toISOString().split('T')[0];
      countMap.set(dStr, Number(r.visit_count));
    }

    // Build continuous array of last `days` days up to today
    const result = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const isoDate = toLocalDateString(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      result.push({
        date: isoDate,
        day: dayName,
        count: countMap.get(isoDate) || 0,
      });
    }

    return result;
  },

  /**
   * Member attendance history and streak calculation.
   *
   * @param {number} memberId
   * @param {object} options
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async getMemberAttendanceHistory(memberId, { page = 1, limit = 20, days = 90 } = {}, connection = pool) {
    const safePage = Math.max(1, parseInt(page, 10) || 1);
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    // Total visits count
    const [totalRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM attendance_records WHERE member_id = ?`,
      [memberId]
    );
    const total = totalRows[0]?.total || 0;

    // Visits this month count
    const [monthRows] = await connection.query(
      `SELECT COUNT(*) AS count 
       FROM attendance_records 
       WHERE member_id = ? 
         AND MONTH(check_in_time) = MONTH(CURDATE()) 
         AND YEAR(check_in_time) = YEAR(CURDATE())`,
      [memberId]
    );
    const visitsThisMonth = monthRows[0]?.count || 0;

    // Paginated list
    const [records] = await connection.query(
      `SELECT 
         ar.id,
         ar.check_in_time,
         ar.check_out_time,
         ar.duration_minutes,
         ar.status,
         ar.pass_status_at_checkin,
         ar.notes,
         p.name AS plan_name,
         pc.name AS category_name
       FROM attendance_records ar
       LEFT JOIN subscriptions s ON s.id = ar.subscription_id
       LEFT JOIN plans p ON p.id = s.plan_id
       LEFT JOIN plan_categories pc ON pc.id = p.category_id
       WHERE ar.member_id = ?
       ORDER BY ar.check_in_time DESC
       LIMIT ? OFFSET ?`,
      [memberId, safeLimit, offset]
    );

    // Heatmap data: day-by-day counts for the past `days` days
    const [heatmapRows] = await connection.query(
      `SELECT 
         DATE(check_in_time) AS date,
         COUNT(*) AS count,
         COALESCE(SUM(duration_minutes), 0) AS total_minutes
       FROM attendance_records
       WHERE member_id = ? 
         AND check_in_time >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(check_in_time)
       ORDER BY date ASC`,
      [memberId, days]
    );

    // Calculate current streak
    const [streakRows] = await connection.query(
      `SELECT DISTINCT DATE(check_in_time) AS visit_date
       FROM attendance_records
       WHERE member_id = ?
       ORDER BY visit_date DESC
       LIMIT 60`,
      [memberId]
    );

    let currentStreak = 0;
    if (streakRows.length > 0) {
      const dates = streakRows.map((r) =>
        typeof r.visit_date === 'string' ? r.visit_date.split('T')[0] : toLocalDateString(r.visit_date)
      );
      const today = toLocalDateString(new Date());
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = toLocalDateString(yesterdayDate);

      // Check if last visit was today or yesterday
      let expectedDate = dates.includes(today) ? new Date() : (dates.includes(yesterday) ? yesterdayDate : null);

      if (expectedDate) {
        for (let i = 0; i < 60; i++) {
          const testIso = toLocalDateString(expectedDate);
          if (dates.includes(testIso)) {
            currentStreak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
    }

    return {
      records,
      heatmap: heatmapRows.map((r) => ({
        date: typeof r.date === 'string' ? r.date.split('T')[0] : toLocalDateString(r.date),
        count: Number(r.count),
        durationMinutes: Number(r.total_minutes),
      })),
      stats: {
        totalVisits: Number(total),
        visitsThisMonth: Number(visitsThisMonth),
        currentStreak,
      },
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    };
  },

  /**
   * Trainer inspection: Get assigned client's attendance history.
   *
   * @param {number} trainerUserId
   * @param {number} memberId
   * @param {object} options
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async getAssignedClientAttendance(trainerUserId, memberId, { page = 1, limit = 20, days = 90 } = {}, connection = pool) {
    // 1. Verify assignment
    const [assignRows] = await connection.query(
      `SELECT id, status, start_date
       FROM trainer_member_assignments
       WHERE trainer_id = ? AND member_id = ? AND status IN ('ACTIVE', 'PAUSED')
       LIMIT 1`,
      [trainerUserId, memberId]
    );

    if (assignRows.length === 0) {
      return null; // Not assigned to this trainer
    }

    return this.getMemberAttendanceHistory(memberId, { page, limit, days }, connection);
  },

  /**
   * Trainer inspection: Overview of all assigned clients and their attendance status.
   *
   * @param {number} trainerUserId
   * @param {object} connection
   * @returns {Promise<object>}
   */
  async getTrainerAttendanceOverview(trainerUserId, connection = pool) {
    const [clients] = await connection.query(
      `SELECT 
         tma.id AS assignment_id,
         tma.member_id,
         tma.status AS assignment_status,
         tma.start_date AS coaching_since,
         um.first_name,
         um.last_name,
         um.email,
         um.phone,
         -- Active pass summary
         (
           SELECT p.name 
           FROM subscriptions s 
           JOIN plans p ON p.id = s.plan_id 
           WHERE s.user_id = tma.member_id AND s.status = 'active' AND s.start_date <= CURDATE() AND s.end_date >= CURDATE()
           ORDER BY s.end_date DESC 
           LIMIT 1
         ) AS active_plan_name,
         -- Is currently checked in today
         CASE WHEN EXISTS (
           SELECT 1 FROM attendance_records ar
           WHERE ar.member_id = tma.member_id 
             AND ar.status = 'CHECKED_IN' 
             AND ar.check_out_time IS NULL 
             AND DATE(ar.check_in_time) = CURDATE()
         ) THEN 1 ELSE 0 END AS is_currently_in_gym,
         -- Has visited today
         CASE WHEN EXISTS (
           SELECT 1 FROM attendance_records ar
           WHERE ar.member_id = tma.member_id 
             AND DATE(ar.check_in_time) = CURDATE()
         ) THEN 1 ELSE 0 END AS has_visited_today,
         -- Visits this month
         (
           SELECT COUNT(*) FROM attendance_records ar
           WHERE ar.member_id = tma.member_id 
             AND MONTH(ar.check_in_time) = MONTH(CURDATE()) 
             AND YEAR(ar.check_in_time) = YEAR(CURDATE())
         ) AS visits_this_month,
         -- Lifetime visits
         (
           SELECT COUNT(*) FROM attendance_records ar
           WHERE ar.member_id = tma.member_id
         ) AS total_visits,
         -- Last visit time
         (
           SELECT ar.check_in_time FROM attendance_records ar
           WHERE ar.member_id = tma.member_id
           ORDER BY ar.check_in_time DESC
           LIMIT 1
         ) AS last_check_in_time,
         -- Last visit duration
         (
           SELECT ar.duration_minutes FROM attendance_records ar
           WHERE ar.member_id = tma.member_id
           ORDER BY ar.check_in_time DESC
           LIMIT 1
         ) AS last_duration_minutes
       FROM trainer_member_assignments tma
       INNER JOIN users um ON tma.member_id = um.id
       WHERE tma.trainer_id = ? AND tma.status IN ('ACTIVE', 'PAUSED')
       ORDER BY 
         is_currently_in_gym DESC,
         has_visited_today DESC,
         um.first_name ASC`,
      [trainerUserId]
    );

    const clientList = clients.map((c) => ({
      assignmentId: c.assignment_id,
      memberId: c.member_id,
      assignmentStatus: c.assignment_status,
      coachingSince: c.coaching_since,
      firstName: c.first_name,
      lastName: c.last_name,
      fullName: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      activePlanName: c.active_plan_name,
      isCurrentlyInGym: Boolean(c.is_currently_in_gym),
      hasVisitedToday: Boolean(c.has_visited_today),
      visitsThisMonth: Number(c.visits_this_month || 0),
      totalVisits: Number(c.total_visits || 0),
      lastCheckInTime: c.last_check_in_time,
      lastDurationMinutes: c.last_duration_minutes,
    }));

    const totalClients = clientList.length;
    const activeInGymNow = clientList.filter((c) => c.isCurrentlyInGym).length;
    const visitedToday = clientList.filter((c) => c.hasVisitedToday).length;
    const totalMonthVisits = clientList.reduce((acc, c) => acc + c.visitsThisMonth, 0);
    const avgMonthlyVisits = totalClients > 0 ? (totalMonthVisits / totalClients).toFixed(1) : 0;

    return {
      clients: clientList,
      metrics: {
        totalClients,
        activeInGymNow,
        visitedToday,
        avgMonthlyVisits: Number(avgMonthlyVisits),
      },
    };
  },
};
