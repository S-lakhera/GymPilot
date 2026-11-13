import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { planApi } from "../api/planApi.js";
import { categoryApi } from "../api/categoryApi.js";

/**
 * Custom Hook for Plan Browsing & Category Filtering.
 * Fetches active plans and active categories with cancellation safety and refresh capability.
 *
 * @param {number|string} [initialCategoryId='all']
 * @returns {{
 *   plans: Array<Object>,
 *   categories: Array<Object>,
 *   filteredPlans: Array<Object>,
 *   selectedCategoryId: string|number,
 *   setSelectedCategoryId: (id: string|number) => void,
 *   isLoading: boolean,
 *   isRefreshing: boolean,
 *   error: Object|null,
 *   refresh: () => Promise<void>
 * }}
 */
export function usePlans(initialCategoryId = "all") {
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(initialCategoryId);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const requestSequenceRef = useRef(0);
  const abortControllerRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const fetchCatalogData = useCallback(async (isManualRefresh = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const sequence = ++requestSequenceRef.current;

    if (isManualRefresh && hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const config = { signal: controller.signal };
      const [plansData, categoriesData] = await Promise.all([
        planApi.listPlans({ isActive: true }, config),
        categoryApi.listCategories({ includeInactive: false }, config),
      ]);

      if (isMountedRef.current && sequence === requestSequenceRef.current && !controller.signal.aborted) {
        setPlans(plansData);
        setCategories(categoriesData);
        hasLoadedRef.current = true;
        setError(null);
      }
    } catch (err) {
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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCatalogData(false);

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCatalogData]);

  const refresh = useCallback(() => {
    return fetchCatalogData(true);
  }, [fetchCatalogData]);

  const filteredPlans = useMemo(() => {
    if (selectedCategoryId === "all" || !selectedCategoryId) {
      return plans;
    }
    return plans.filter((p) => String(p.category_id) === String(selectedCategoryId));
  }, [plans, selectedCategoryId]);

  return {
    plans,
    categories,
    filteredPlans,
    selectedCategoryId,
    setSelectedCategoryId,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}

export default usePlans;

