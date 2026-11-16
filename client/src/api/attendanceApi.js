import { axiosClient } from './axiosClient.js';
import { normalizeApiError } from './authApi.js';

function cleanParams(params) {
  if (!params) return {};
  const cleaned = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Attendance Management API Client
 */
export const attendanceApi = {
  /**
   * Admin: Get attendance overview (stats, trend, currently in gym, logs).
   */
  async getAdminOverview(params = {}) {
    try {
      const res = await axiosClient.get('/attendance/admin/overview', {
        params: cleanParams(params),
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Search members for quick check-in suggestions.
   */
  async searchMembers(query = '') {
    try {
      const res = await axiosClient.get('/attendance/admin/members/search', {
        params: { q: query },
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Record member check-in (mark present).
   */
  async checkIn({ memberId, checkInTime, notes, overrideConfirmed, overrideNote }) {
    try {
      const res = await axiosClient.post('/attendance/check-in', {
        memberId,
        checkInTime,
        notes,
        overrideConfirmed,
        overrideNote,
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Record member check-out.
   */
  async checkOut(attendanceId, { checkOutTime, notes } = {}) {
    try {
      const res = await axiosClient.put(`/attendance/${attendanceId}/check-out`, {
        checkOutTime,
        notes,
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Correct an attendance record.
   */
  async updateRecord(attendanceId, { checkInTime, checkOutTime, notes, status }) {
    try {
      const res = await axiosClient.put(`/attendance/${attendanceId}`, {
        checkInTime,
        checkOutTime,
        notes,
        status,
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Admin: Delete an accidental attendance record.
   */
  async deleteRecord(attendanceId) {
    try {
      const res = await axiosClient.delete(`/attendance/${attendanceId}`);
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Member: Get own attendance history, streak, and heatmap.
   */
  async getMyHistory(params = {}) {
    try {
      const res = await axiosClient.get('/attendance/my-history', {
        params: cleanParams(params),
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },

  /**
   * Trainer: Get assigned client's attendance history.
   */
  async getClientHistory(memberId, params = {}) {
    try {
      const res = await axiosClient.get(`/attendance/clients/${memberId}`, {
        params: cleanParams(params),
      });
      return res.data.data;
    } catch (err) {
      throw normalizeApiError(err);
    }
  },
};
