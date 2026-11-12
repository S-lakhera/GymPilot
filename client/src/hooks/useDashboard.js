import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth.js";
import { dashboardApi } from "../api/dashboardApi.js";
import { USER_ROLES } from "../utils/constants.js";

/**
 * Custom Hook for role-specific dashboard data fetching and refresh management.
 *
 * Responsibilities:
 * - Fetches role-tailored metrics on initial mount.
 * - Handles asynchronous loading, manual on-demand refresh, and error states.
 * - Enforces AbortController cleanup to cancel stale responses upon unmount or role changes.
 * - Strictly isolates read-only dashboard retrieval (zero automated write/sync calls).
 *
 * @param {string} [overrideRole] - Optional role override; defaults to active auth role.
 * @returns {{
 *   data: Object|null,
 *   isLoading: boolean,
 *   isRefreshing: boolean,
 *   error: Object|null,
 *   refresh: () => Promise<void>
 * }}
 */
export function useDashboard(overrideRole) {
  const { role: authRole, isAuthenticated } = useAuth();
  const role = overrideRole || authRole;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Track active fetch to avoid race conditions and unmounted state updates
  const isMountedRef = useRef(true);

  const fetchDashboardData = useCallback(
    async (isManualRefresh = false) => {
      if (!isAuthenticated || !role) {
        setIsLoading(false);
        return;
      }

      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        let result = null;
        switch (role) {
          case USER_ROLES.ADMIN:
            result = await dashboardApi.getAdminDashboard();
            break;
          case USER_ROLES.TRAINER:
            result = await dashboardApi.getTrainerDashboard();
            break;
          case USER_ROLES.MEMBER:
          default:
            result = await dashboardApi.getMemberDashboard();
            break;
        }

        if (isMountedRef.current) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [isAuthenticated, role]
  );

  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchDashboardData]);

  const refresh = useCallback(() => {
    return fetchDashboardData(true);
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}

export default useDashboard;
