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

  // Track active fetch, request sequence token, and controller to avoid race conditions
  const isMountedRef = useRef(true);
  const requestSequenceRef = useRef(0);
  const abortControllerRef = useRef(null);
  const dataRef = useRef(data);
  dataRef.current = data;

  const fetchDashboardData = useCallback(
    async (isManualRefresh = false) => {
      if (!isAuthenticated || !role) {
        setIsLoading(false);
        return;
      }

      // Abort previous in-flight request if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const sequence = ++requestSequenceRef.current;

      // If manual refresh is triggered with existing data, use isRefreshing to keep the dashboard visible;
      // if retrying from an error or no prior data exists, use isLoading for the skeleton.
      if (isManualRefresh && dataRef.current !== null) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        let result = null;
        const config = { signal: controller.signal };

        switch (role) {
          case USER_ROLES.ADMIN:
            result = await dashboardApi.getAdminDashboard(config);
            break;
          case USER_ROLES.TRAINER:
            result = await dashboardApi.getTrainerDashboard(config);
            break;
          case USER_ROLES.MEMBER:
          default:
            result = await dashboardApi.getMemberDashboard(config);
            break;
        }

        if (isMountedRef.current && sequence === requestSequenceRef.current && !controller.signal.aborted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        // Discard canceled/aborted requests and superseded sequences
        if (controller.signal.aborted || sequence !== requestSequenceRef.current) {
          return;
        }
        if (isMountedRef.current) {
          setError(err);
        }
      } finally {
        if (isMountedRef.current && sequence === requestSequenceRef.current) {
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
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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

