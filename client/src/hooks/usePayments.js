import { useState, useEffect, useCallback, useMemo } from "react";
import { paymentApi } from "../api/paymentApi.js";
import { refundApi } from "../api/refundApi.js";

/**
 * Custom hook for Admin Financials & Payments Ledger.
 * Manages transaction listings, filters, refund audit logs, and refund execution with ceiling checks.
 */
export function usePayments({ initialLimit = 20 } = {}) {
  const [payments, setPayments] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [activeTab, setActiveTab] = useState("ledger"); // "ledger" | "refunds"
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(initialLimit);

  const fetchFinancials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [paymentsRes, refundsRes] = await Promise.all([
        paymentApi.listAllPayments({
          page,
          limit,
          paymentStatus: statusFilter === "all" ? undefined : statusFilter,
          paymentMethod: methodFilter === "all" ? undefined : methodFilter,
        }),
        refundApi.listRefunds({ page: 1, limit: 100 }),
      ]);

      setPayments(paymentsRes.payments || []);
      setRefunds(refundsRes.refunds || []);
    } catch (err) {
      setError(err.message || "Failed to load financial records.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, methodFilter]);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  // Client-side search filtering across transactions
  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments;
    const query = search.trim().toLowerCase();
    return payments.filter((p) => {
      const memberName = p.member_name?.toLowerCase() || "";
      const email = p.member_email?.toLowerCase() || "";
      const ref = p.transaction_reference?.toLowerCase() || "";
      const plan = p.plan_name?.toLowerCase() || "";
      return (
        memberName.includes(query) ||
        email.includes(query) ||
        ref.includes(query) ||
        plan.includes(query)
      );
    });
  }, [payments, search]);

  // Client-side search filtering across refunds audit
  const filteredRefunds = useMemo(() => {
    if (!search.trim()) return refunds;
    const query = search.trim().toLowerCase();
    return refunds.filter((r) => {
      const reason = r.reason?.toLowerCase() || "";
      const ref = r.gateway_refund_reference?.toLowerCase() || "";
      const member = r.member_name?.toLowerCase() || "";
      return reason.includes(query) || ref.includes(query) || member.includes(query);
    });
  }, [refunds, search]);

  // Aggregate financial metrics
  const metrics = useMemo(() => {
    let grossCollected = 0;
    let totalRefunded = 0;
    let completedCount = 0;

    payments.forEach((p) => {
      const amt = Number(p.amount) || 0;
      const refAmt = Number(p.refunded_amount) || 0;

      if (p.payment_status === "COMPLETED" || p.payment_status === "PARTIALLY_REFUNDED") {
        grossCollected += amt;
        totalRefunded += refAmt;
        completedCount += 1;
      } else if (p.payment_status === "REFUNDED") {
        grossCollected += amt;
        totalRefunded += refAmt || amt;
      }
    });

    const netRevenue = grossCollected - totalRefunded;

    return {
      grossCollected,
      totalRefunded,
      netRevenue,
      completedCount,
    };
  }, [payments]);

  // Execute refund
  const issueRefund = useCallback(
    async ({ paymentId, amount, reason }) => {
      setRefunding(true);
      try {
        const result = await refundApi.processRefund({
          paymentId: Number(paymentId),
          amount: Number(amount),
          reason,
        });
        await fetchFinancials();
        return result;
      } catch (err) {
        throw err;
      } finally {
        setRefunding(false);
      }
    },
    [fetchFinancials]
  );

  return {
    payments,
    filteredPayments,
    refunds,
    filteredRefunds,
    metrics,
    loading,
    refunding,
    error,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter: (val) => {
      setStatusFilter(val);
      setPage(1);
    },
    methodFilter,
    setMethodFilter: (val) => {
      setMethodFilter(val);
      setPage(1);
    },
    search,
    setSearch,
    page,
    setPage,
    issueRefund,
    refetch: fetchFinancials,
  };
}
