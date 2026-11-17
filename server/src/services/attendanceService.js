import { pool, withTransaction } from '../config/db.js';
import { attendanceRepository } from '../repositories/attendanceRepository.js';
import { userRepository } from '../repositories/userRepository.js';

/**
 * Parse any date/datetime representation into a JavaScript Date object.
 * Strings without timezone (e.g. 'YYYY-MM-DD HH:mm:ss' or 'YYYY-MM-DDTHH:mm:ss')
 * are explicitly anchored to Indian Standard Time (+05:30 / Asia/Kolkata) to
 * ensure calculations remain consistent regardless of the Node process timezone.
 */
function parseDateAsIST(dateVal) {
  if (!dateVal) return null;
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal;
  }
  if (typeof dateVal === 'string') {
    const trimmed = dateVal.trim();
    if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const d = new Date(`${trimmed.replace(' ', 'T')}+05:30`);
      return isNaN(d.getTime()) ? null : d;
    }
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format any date input into MySQL DATETIME string ('YYYY-MM-DD HH:mm:ss')
 * explicitly in Asia/Kolkata (+05:30) timezone.
 */
function formatToMysqlDatetime(dateInput) {
  if (!dateInput) return null;
  let d;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    d = parseDateAsIST(trimmed);
  } else {
    d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  }
  if (!d || isNaN(d.getTime())) return null;

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);

  const p = {};
  for (const part of parts) {
    p[part.type] = part.value;
  }
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export const attendanceService = {
  /**
   * Admin mark member present (Check-in).
   *
   * Enforces:
   * 1. Target user exists, has role 'member', and is active.
   * 2. Row locking on the member row to serialize concurrent check-in submissions.
   * 3. Session exclusivity: Rejects with 409 if member already has an active open session today.
   * 4. Soft pass check:
   *    - If active pass exists, proceeds automatically.
   *    - If no active pass, requires overrideConfirmed=true (with optional overrideNote); otherwise rejects with 400.
   */
  async recordCheckIn({
    memberId,
    recordedById,
    checkInTime = null,
    notes = null,
    overrideConfirmed = false,
    overrideNote = null,
  }) {
    return withTransaction(async (conn) => {
      // 1. Lock member row
      const lockedMember = await userRepository.lockUser(memberId, conn);
      if (!lockedMember) {
        const err = new Error('Member not found.');
        err.statusCode = 404;
        throw err;
      }

      // Fetch member profile details
      const member = await userRepository.findById(memberId, conn);
      if (!member || member.role !== 'member') {
        const err = new Error('Target user is not a gym member.');
        err.statusCode = 400;
        throw err;
      }
      if (!member.is_active) {
        const err = new Error('Cannot check in a deactivated member account.');
        err.statusCode = 400;
        throw err;
      }

      // 2. Prevent duplicate active session today
      const existingOpenSession = await attendanceRepository.findOpenSessionToday(memberId, conn, true);
      if (existingOpenSession) {
        const err = new Error(
          `Member ${member.first_name} ${member.last_name} is already checked in today. Check them out before starting a new session.`
        );
        err.statusCode = 409;
        err.code = 'ACTIVE_SESSION_EXISTS';
        err.data = { existingSessionId: existingOpenSession.id };
        throw err;
      }

      // 3. Evaluate membership pass status
      const [activeSubs] = await conn.query(
        `SELECT s.id, s.plan_id, s.start_date, s.end_date, p.name AS plan_name, pc.name AS category_name
         FROM subscriptions s
         INNER JOIN plans p ON p.id = s.plan_id
         INNER JOIN plan_categories pc ON pc.id = p.category_id
         WHERE s.user_id = ? 
           AND s.status = 'active' 
           AND s.start_date <= CURDATE() 
           AND s.end_date >= CURDATE()
         ORDER BY s.end_date DESC
         LIMIT 1`,
        [memberId]
      );

      let subscriptionId = null;
      let passStatus = 'ACTIVE_PASS';

      if (activeSubs.length > 0) {
        subscriptionId = activeSubs[0].id;
        passStatus = 'ACTIVE_PASS';
      } else {
        // Check if member holds any historical subscriptions
        const [anySubs] = await conn.query(
          `SELECT id, status FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
          [memberId]
        );

        passStatus = anySubs.length > 0 ? 'EXPIRED_PASS' : 'NO_PASS';

        // Soft validation check: requires override confirmation from admin
        if (!overrideConfirmed) {
          const err = new Error(
            passStatus === 'EXPIRED_PASS'
              ? 'Member holds an expired or paused membership pass. Admin override required to record attendance.'
              : 'Member has no active membership pass. Admin override required to record attendance.'
          );
          err.statusCode = 400;
          err.code = 'PASS_OVERRIDE_REQUIRED';
          err.data = {
            passStatus,
            requiresOverride: true,
            memberName: `${member.first_name} ${member.last_name}`,
          };
          throw err;
        }
      }

      // 4. Create check-in record
      const effectiveCheckIn = checkInTime ? parseDateAsIST(checkInTime) : new Date();
      const record = await attendanceRepository.createCheckIn(
        {
          memberId,
          subscriptionId,
          checkInTime: formatToMysqlDatetime(effectiveCheckIn),
          recordedById,
          passStatusAtCheckin: passStatus,
          overrideNote,
          notes,
        },
        conn
      );

      return record;
    });
  },

  /**
   * Admin mark member check-out.
   */
  async recordCheckOut(attendanceId, { checkOutTime = null, notes = null } = {}) {
    return withTransaction(async (conn) => {
      const record = await attendanceRepository.findById(attendanceId, conn, true);
      if (!record) {
        const err = new Error('Attendance record not found.');
        err.statusCode = 404;
        throw err;
      }

      if (record.status === 'CHECKED_OUT') {
        const err = new Error('This session has already been checked out.');
        err.statusCode = 400;
        throw err;
      }

      // Calculate duration in minutes
      const effectiveCheckOut = checkOutTime ? parseDateAsIST(checkOutTime) : new Date();
      const effectiveCheckIn = parseDateAsIST(record.check_in_time);

      if (effectiveCheckOut < effectiveCheckIn) {
        const err = new Error('Check-out time cannot be earlier than check-in time.');
        err.statusCode = 400;
        throw err;
      }

      const durationMinutes = Math.max(
        0,
        Math.round((effectiveCheckOut.getTime() - effectiveCheckIn.getTime()) / (1000 * 60))
      );

      const updated = await attendanceRepository.updateCheckOut(
        attendanceId,
        {
          checkOutTime: formatToMysqlDatetime(effectiveCheckOut),
          durationMinutes,
          notes,
        },
        conn
      );

      return updated;
    });
  },

  /**
   * Admin correction: Update timestamps, notes, and duration.
   */
  async updateAttendanceRecord(id, { checkInTime, checkOutTime, notes, status }) {
    return withTransaction(async (conn) => {
      const record = await attendanceRepository.findById(id, conn, true);
      if (!record) {
        const err = new Error('Attendance record not found.');
        err.statusCode = 404;
        throw err;
      }

      const effectiveIn = checkInTime !== undefined ? parseDateAsIST(checkInTime) : parseDateAsIST(record.check_in_time);
      let effectiveOut = checkOutTime !== undefined ? (checkOutTime ? parseDateAsIST(checkOutTime) : null) : (record.check_out_time ? parseDateAsIST(record.check_out_time) : null);
      let calculatedDuration = record.duration_minutes;

      if (effectiveOut) {
        if (effectiveOut < effectiveIn) {
          const err = new Error('Check-out time cannot be earlier than check-in time.');
          err.statusCode = 400;
          throw err;
        }
        calculatedDuration = Math.max(0, Math.round((effectiveOut.getTime() - effectiveIn.getTime()) / (1000 * 60)));
      } else {
        calculatedDuration = null;
      }

      if (status === 'CHECKED_OUT' && !effectiveOut) {
        const err = new Error('Cannot set status to CHECKED_OUT without a valid check-out timestamp.');
        err.statusCode = 400;
        throw err;
      }

      if (status === 'CHECKED_IN' && effectiveOut) {
        const err = new Error('Cannot set status to CHECKED_IN while a check-out time is present. Clear the check-out time to reopen this session.');
        err.statusCode = 400;
        throw err;
      }

      const determinedStatus = status || (effectiveOut ? 'CHECKED_OUT' : 'CHECKED_IN');

      // If record is being marked as open CHECKED_IN, verify no other concurrent active session exists
      if (determinedStatus === 'CHECKED_IN') {
        const [otherOpen] = await conn.query(
          `SELECT id FROM attendance_records 
           WHERE member_id = ? 
             AND status = 'CHECKED_IN' 
             AND check_out_time IS NULL 
             AND id != ? 
           LIMIT 1 FOR UPDATE`,
          [record.member_id, id]
        );
        if (otherOpen.length > 0) {
          const err = new Error(
            'Member already has another active open session. Close that session before marking this record as checked in.'
          );
          err.statusCode = 409;
          err.code = 'ACTIVE_SESSION_EXISTS';
          err.data = { existingSessionId: otherOpen[0].id };
          throw err;
        }
      }

      const updated = await attendanceRepository.updateRecord(
        id,
        {
          checkInTime: checkInTime !== undefined ? formatToMysqlDatetime(effectiveIn) : undefined,
          checkOutTime: checkOutTime !== undefined ? (effectiveOut ? formatToMysqlDatetime(effectiveOut) : null) : undefined,
          durationMinutes: calculatedDuration,
          notes,
          status: determinedStatus,
        },
        conn
      );

      return updated;
    });
  },

  /**
   * Admin deletion of accidental record.
   */
  async deleteAttendanceRecord(id) {
    const record = await attendanceRepository.findById(id);
    if (!record) {
      const err = new Error('Attendance record not found.');
      err.statusCode = 404;
      throw err;
    }

    await attendanceRepository.deleteRecord(id);
    return { id, deleted: true };
  },

  /**
   * Admin Overview: Stats, trend, currently in gym, and paginated logs.
   */
  async getAdminOverview({ date, startDate, endDate, search, status, page = 1, limit = 20 }) {
    const [stats, trend, currentlyInGym, logs] = await Promise.all([
      attendanceRepository.getTodayStats(),
      attendanceRepository.getRecentTrend(7),
      attendanceRepository.getCurrentlyInGym(),
      attendanceRepository.listAttendanceLogs({ date, startDate, endDate, search, status, page, limit }),
    ]);

    return {
      stats,
      trend,
      currentlyInGym,
      logs: logs.records,
      pagination: logs.pagination,
    };
  },

  /**
   * Member personal attendance history with streak & heatmap.
   */
  async getMemberAttendanceHistory(memberId, options = {}) {
    return attendanceRepository.getMemberAttendanceHistory(memberId, options);
  },

  /**
   * Trainer client attendance inspection.
   */
  async getClientAttendanceForTrainer(trainerUserId, memberId, options = {}) {
    const result = await attendanceRepository.getAssignedClientAttendance(trainerUserId, memberId, options);
    if (!result) {
      const err = new Error('Client attendance not found or member is not assigned to your coaching roster.');
      err.statusCode = 403;
      throw err;
    }
    return result;
  },

  /**
   * Trainer Overview: Get all assigned clients attendance status and roster metrics.
   */
  async getTrainerAttendanceOverview(trainerUserId) {
    return attendanceRepository.getTrainerAttendanceOverview(trainerUserId);
  },

  /**
   * Member search suggestions for Admin quick check-in desk.
   */
  async searchMembersForCheckIn(query = '') {
    const clean = query ? query.trim() : '';
    if (!clean) {
      return [];
    }

    const searchTerm = `%${clean}%`;
    const [members] = await pool.query(
      `SELECT 
         u.id,
         u.first_name,
         u.last_name,
         u.email,
         u.phone,
         u.is_active,
         -- Check if currently in gym today
         CASE WHEN EXISTS (
           SELECT 1 FROM attendance_records ar 
           WHERE ar.member_id = u.id AND ar.status = 'CHECKED_IN' AND ar.check_out_time IS NULL AND DATE(ar.check_in_time) = CURDATE()
         ) THEN 1 ELSE 0 END AS is_currently_in_gym,
         -- Active pass summary
         (
           SELECT p.name 
           FROM subscriptions s 
           JOIN plans p ON p.id = s.plan_id 
           WHERE s.user_id = u.id AND s.status = 'active' AND s.start_date <= CURDATE() AND s.end_date >= CURDATE()
           ORDER BY s.end_date DESC 
           LIMIT 1
         ) AS active_plan_name
       FROM users u
       WHERE u.role = 'member' AND u.deleted_at IS NULL
         AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.id = ?)
       LIMIT 10`,
      [searchTerm, searchTerm, searchTerm, searchTerm, parseInt(clean, 10) || 0]
    );

    return members.map((m) => ({
      id: m.id,
      name: `${m.first_name} ${m.last_name}`,
      firstName: m.first_name,
      lastName: m.last_name,
      email: m.email,
      phone: m.phone,
      isActive: Boolean(m.is_active),
      isCurrentlyInGym: Boolean(m.is_currently_in_gym),
      hasActivePass: Boolean(m.active_plan_name),
      activePlanName: m.active_plan_name || null,
    }));
  },
};
