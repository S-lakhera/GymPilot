import { useState, useEffect, useCallback, useRef } from 'react';
import { attendanceApi } from '../api/attendanceApi.js';
import { useAuth } from './useAuth.js';
import { useToast } from './useToast.js';
import { USER_ROLES } from '../utils/constants.js';

export function useAttendance(initialFilters = {}) {
  const { role, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const loadGenRef = useRef(0);
  const filtersRef = useRef(initialFilters);
  filtersRef.current = initialFilters;

  const {
    date,
    startDate,
    endDate,
    search,
    status,
    page,
    limit,
  } = initialFilters;

  const fetchOverview = useCallback(async (overrideFilters) => {
    if (!isAuthenticated || role !== USER_ROLES.ADMIN) return;
    const currentGen = ++loadGenRef.current;
    setIsLoading(true);
    setError(null);

    const activeFilters = overrideFilters || filtersRef.current;

    try {
      const overview = await attendanceApi.getAdminOverview(activeFilters);
      if (currentGen === loadGenRef.current) {
        setData(overview);
        setError(null);
      }
    } catch (err) {
      if (currentGen === loadGenRef.current) {
        const errorMsg = err.message || 'Failed to load attendance records.';
        setError(errorMsg);
      }
    } finally {
      if (currentGen === loadGenRef.current) {
        setIsLoading(false);
      }
    }
  }, [role, isAuthenticated]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview, date, startDate, endDate, search, status, page, limit]);

  /**
   * Mark a member present (Check-in).
   */
  const checkIn = async ({ memberId, checkInTime, notes, overrideConfirmed = false, overrideNote = null }) => {
    setIsMutating(true);
    try {
      const record = await attendanceApi.checkIn({
        memberId,
        checkInTime,
        notes,
        overrideConfirmed,
        overrideNote,
      });
      showToast('Member marked present successfully.', 'success');
      await fetchOverview();
      return { success: true, record };
    } catch (err) {
      // Soft pass override signal
      if (err.code === 'PASS_OVERRIDE_REQUIRED' || err.data?.requiresOverride) {
        return {
          success: false,
          requiresOverride: true,
          passStatus: err.data?.passStatus || 'NO_PASS',
          memberName: err.data?.memberName || 'Member',
          message: err.message,
        };
      }
      showToast(err.message || 'Failed to check in member.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * Check out a member session.
   */
  const checkOut = async (attendanceId, { checkOutTime = null, notes = null } = {}) => {
    setIsMutating(true);
    try {
      const record = await attendanceApi.checkOut(attendanceId, { checkOutTime, notes });
      showToast(`Member checked out. Duration: ${record.duration_minutes || 0}m`, 'success');
      await fetchOverview();
      return { success: true, record };
    } catch (err) {
      showToast(err.message || 'Failed to check out member.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * Update attendance record (Admin correction).
   */
  const updateRecord = async (attendanceId, updateData) => {
    setIsMutating(true);
    try {
      const updated = await attendanceApi.updateRecord(attendanceId, updateData);
      showToast('Attendance record updated successfully.', 'success');
      await fetchOverview();
      return { success: true, record: updated };
    } catch (err) {
      showToast(err.message || 'Failed to update record.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  /**
   * Delete attendance record.
   */
  const deleteRecord = async (attendanceId) => {
    setIsMutating(true);
    try {
      await attendanceApi.deleteRecord(attendanceId);
      showToast('Attendance record deleted.', 'success');
      await fetchOverview();
      return { success: true };
    } catch (err) {
      showToast(err.message || 'Failed to delete record.', 'error');
      return { success: false, error: err.message };
    } finally {
      setIsMutating(false);
    }
  };

  return {
    data,
    stats: data?.stats || { currentlyInGym: 0, totalVisitsToday: 0, completedVisitsToday: 0 },
    trend: data?.trend || [],
    currentlyInGym: data?.currentlyInGym || [],
    logs: data?.logs || [],
    pagination: data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 },
    isLoading,
    isMutating,
    error,
    refresh: fetchOverview,
    checkIn,
    checkOut,
    updateRecord,
    deleteRecord,
  };
}
