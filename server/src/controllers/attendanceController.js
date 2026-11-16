import { attendanceService } from '../services/attendanceService.js';
import { ApiResponse } from '../utils/apiResponse.js';

function normalizeBoolean(val) {
  if (val === true || val === 'true' || val === 1 || val === '1') return true;
  return false;
}

function cleanQueryParams(query = {}) {
  const cleaned = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export const attendanceController = {
  /**
   * Admin: Check-in a member (mark present).
   */
  async recordCheckIn(req, res) {
    const { memberId, checkInTime, notes, overrideConfirmed, overrideNote } = req.body;

    const record = await attendanceService.recordCheckIn({
      memberId: Number(memberId),
      recordedById: req.user.id,
      checkInTime,
      notes,
      overrideConfirmed: normalizeBoolean(overrideConfirmed),
      overrideNote,
    });

    return ApiResponse.created(res, record, 'Attendance check-in recorded successfully.');
  },

  /**
   * Admin: Check-out a member.
   */
  async recordCheckOut(req, res) {
    const attendanceId = Number(req.params.id);
    const { checkOutTime, notes } = req.body;

    const record = await attendanceService.recordCheckOut(attendanceId, {
      checkOutTime,
      notes,
    });

    return ApiResponse.success(res, record, 'Attendance check-out recorded successfully.');
  },

  /**
   * Admin: Correct an attendance record (timestamps, notes, status).
   */
  async updateAttendanceRecord(req, res) {
    const attendanceId = Number(req.params.id);
    const { checkInTime, checkOutTime, notes, status } = req.body;

    const record = await attendanceService.updateAttendanceRecord(attendanceId, {
      checkInTime,
      checkOutTime,
      notes,
      status,
    });

    return ApiResponse.success(res, record, 'Attendance record updated successfully.');
  },

  /**
   * Admin: Delete an accidental attendance record.
   */
  async deleteAttendanceRecord(req, res) {
    const attendanceId = Number(req.params.id);
    const result = await attendanceService.deleteAttendanceRecord(attendanceId);
    return ApiResponse.success(res, result, 'Attendance record deleted successfully.');
  },

  /**
   * Admin: Get attendance overview (stats, 7-day trend, currently in gym, and logs).
   */
  async getAdminOverview(req, res) {
    const params = cleanQueryParams(req.query);
    const date = params.date || null;
    const startDate = params.startDate || null;
    const endDate = params.endDate || null;
    const search = params.search || '';
    const status = params.status || '';
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(params.limit, 10) || 20));

    const overview = await attendanceService.getAdminOverview({
      date,
      startDate,
      endDate,
      search,
      status,
      page,
      limit,
    });

    return ApiResponse.success(res, overview, 'Attendance overview retrieved successfully.');
  },

  /**
   * Admin: Search members for quick check-in suggestions.
   */
  async searchMembers(req, res) {
    const query = req.query.q || '';
    const members = await attendanceService.searchMembersForCheckIn(query);
    return ApiResponse.success(res, members, 'Matching members retrieved successfully.');
  },

  /**
   * Member: Get own attendance history, streak, and heatmap.
   */
  async getMemberHistory(req, res) {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
    const days = Math.max(14, Math.min(365, parseInt(req.query.days, 10) || 90));

    const history = await attendanceService.getMemberAttendanceHistory(req.user.id, {
      page,
      limit,
      days,
    });

    return ApiResponse.success(res, history, 'Member attendance history retrieved successfully.');
  },

  /**
   * Trainer: Get assigned client's attendance history.
   */
  async getClientAttendanceForTrainer(req, res) {
    const memberId = Number(req.params.memberId);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));

    const history = await attendanceService.getClientAttendanceForTrainer(req.user.id, memberId, {
      page,
      limit,
    });

    return ApiResponse.success(res, history, 'Client attendance history retrieved successfully.');
  },
};
