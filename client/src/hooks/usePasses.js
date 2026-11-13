import { useState, useEffect, useCallback, useMemo } from "react";
import { subscriptionApi } from "../api/subscriptionApi.js";

/**
 * Custom hook for Member Passes Workspace.
 * Fetches member's subscription history, partitions into active, queued, and past passes,
 * calculates summary metrics, and manages queued pass cancellation.
 *
 * @returns {{
 *   passes: Array<Object>,
 *   activePasses: Array<Object>,
 *   queuedPasses: Array<Object>,
 *   pastPasses: Array<Object>,
 *   filteredActive: Array<Object>,
 *   filteredQueued: Array<Object>,
 *   filteredPast: Array<Object>,
 *   categories: Array<{ id: string|number, name: string, count: number }>,
 *   selectedCategory: string|number,
 *   setSelectedCategory: (cat: string|number) => void,
 *   counters: { active: number, queued: number, past: number, totalInvested: number },
 *   loading: boolean,
 *   cancelling: boolean,
 *   error: string|null,
 *   cancelPass: (passId: number|string) => Promise<Object>,
 *   refetch: () => Promise<void>
 * }}
 */
export function usePasses() {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchPasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionApi.listSubscriptions({ limit: 100 });
      setPasses(response.subscriptions || []);
    } catch (err) {
      setError(err.message || "Failed to load passes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPasses();
  }, [fetchPasses]);

  // Partition passes into lifecycles
  const activePasses = useMemo(
    () => passes.filter((p) => p.status === "active"),
    [passes]
  );

  const queuedPasses = useMemo(
    () => passes.filter((p) => p.status === "queued"),
    [passes]
  );

  const pastPasses = useMemo(
    () => passes.filter((p) => p.status === "expired" || p.status === "cancelled"),
    [passes]
  );

  // Summary Metrics / KPIs
  const counters = useMemo(() => {
    const totalInvested = passes.reduce((sum, p) => {
      const amt = Number(p.price_paid ?? p.final_amount ?? 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);

    return {
      active: activePasses.length,
      queued: queuedPasses.length,
      past: pastPasses.length,
      totalInvested,
    };
  }, [passes, activePasses.length, queuedPasses.length, pastPasses.length]);

  // Category Extraction
  const categories = useMemo(() => {
    const map = new Map();
    passes.forEach((p) => {
      const catId = p.category_id || "general";
      const catName = p.category_name || "General";
      if (!map.has(catId)) {
        map.set(catId, { id: catId, name: catName, count: 0 });
      }
      map.get(catId).count += 1;
    });
    return Array.from(map.values());
  }, [passes]);

  // Filtering by selected category
  const matchesCategory = useCallback(
    (p) => {
      if (selectedCategory === "all") return true;
      return String(p.category_id) === String(selectedCategory);
    },
    [selectedCategory]
  );

  const filteredActive = useMemo(
    () => activePasses.filter(matchesCategory),
    [activePasses, matchesCategory]
  );

  const filteredQueued = useMemo(
    () => queuedPasses.filter(matchesCategory),
    [queuedPasses, matchesCategory]
  );

  const filteredPast = useMemo(
    () => pastPasses.filter(matchesCategory),
    [pastPasses, matchesCategory]
  );

  // Cancel Pass action
  const cancelPass = useCallback(
    async (passId) => {
      setCancelling(true);
      try {
        const result = await subscriptionApi.cancelSubscription(passId);
        // Refresh passes state to reflect updated status and any promoted passes
        await fetchPasses();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setCancelling(false);
      }
    },
    [fetchPasses]
  );

  return {
    passes,
    activePasses,
    queuedPasses,
    pastPasses,
    filteredActive,
    filteredQueued,
    filteredPast,
    categories,
    selectedCategory,
    setSelectedCategory,
    counters,
    loading,
    cancelling,
    error,
    cancelPass,
    refetch: fetchPasses,
  };
}
