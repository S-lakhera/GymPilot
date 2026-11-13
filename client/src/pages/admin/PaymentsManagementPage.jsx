import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { usePayments } from "../../hooks/usePayments.js";
import { TransactionLedgerTable } from "../../components/payments/TransactionLedgerTable.jsx";
import { TransactionFilterBar } from "../../components/payments/TransactionFilterBar.jsx";
import { IssueRefundModal } from "../../components/payments/IssueRefundModal.jsx";
import { RefundsAuditTable } from "../../components/payments/RefundsAuditTable.jsx";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Admin Payments Management Hub & Refund Governance.
 */
export function PaymentsManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");

  const {
    filteredPayments,
    filteredRefunds,
    metrics,
    loading,
    refunding,
    error,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    search,
    setSearch,
    issueRefund,
    refetch,
  } = usePayments();

  // Synchronize tab with URL query param if present
  useEffect(() => {
    if (urlTab === "refunds" && activeTab !== "refunds") {
      setActiveTab("refunds");
    } else if (urlTab === "ledger" && activeTab !== "ledger") {
      setActiveTab("ledger");
    }
  }, [urlTab, activeTab, setActiveTab]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // Refund Modal state
  const [selectedPaymentForRefund, setSelectedPaymentForRefund] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleConfirmRefund = async (payload) => {
    try {
      const result = await issueRefund(payload);
      setFeedback({
        type: "success",
        message: result.message || `Refund of ${formatCurrency(payload.amount)} successfully processed.`,
      });
      setSelectedPaymentForRefund(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to process refund. Please try again.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/20">
            Admin Financial Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading tracking-tight">
            Financial Ledger & Refund Hub
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Audit payments, process authorized refunds with ceiling balances, and monitor cash inflows.
          </p>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
            Page Gross Collections
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-emerald-400">
            {formatCurrency(metrics.grossCollected)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Current page receipts</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
            Page Total Refunded
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-amber-400">
            {formatCurrency(metrics.totalRefunded)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Current page refunded capital</div>
        </div>

        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
            Page Net Revenue
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-cyan-400">
            {formatCurrency(metrics.netRevenue)}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Current page retained capital</div>
        </div>

        <div className="p-4 rounded-xl border border-zinc-700/50 bg-zinc-800/40 backdrop-blur-sm">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
            Page Completed Transactions
          </div>
          <div className="mt-2 text-2xl font-bold font-heading text-zinc-100">
            {metrics.completedCount}
          </div>
          <div className="mt-1 text-xs text-zinc-500">Current page settlement count</div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="hover:opacity-75 text-sm font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={refetch}
            className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          type="button"
          onClick={() => handleTabChange("ledger")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "ledger"
              ? "bg-emerald-500 text-zinc-950 shadow-sm shadow-emerald-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <span>Transaction Ledger</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "ledger" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {filteredPayments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("refunds")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "refunds"
              ? "bg-amber-500 text-zinc-950 shadow-sm shadow-amber-500/20"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
          }`}
        >
          <span>Refunds Audit Log</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === "refunds" ? "bg-zinc-950/20 text-zinc-950" : "bg-zinc-800 text-zinc-400"
            }`}
          >
            {filteredRefunds.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Ledger */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <TransactionFilterBar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            methodFilter={methodFilter}
            onMethodFilterChange={setMethodFilter}
            totalRecords={filteredPayments.length}
          />

          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
              Loading payments ledger...
            </div>
          ) : (
            <TransactionLedgerTable
              payments={filteredPayments}
              onRequestRefund={(p) => setSelectedPaymentForRefund(p)}
            />
          )}
        </div>
      )}

      {/* Tab 2: Refunds Audit */}
      {activeTab === "refunds" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search refunds by member, reason, or ref..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <span className="text-xs text-zinc-400 font-mono bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-700/50">
              {filteredRefunds.length} refund records
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
              Loading refund logs...
            </div>
          ) : (
            <RefundsAuditTable refunds={filteredRefunds} />
          )}
        </div>
      )}

      {/* Issue Refund Modal */}
      <IssueRefundModal
        payment={selectedPaymentForRefund}
        isOpen={Boolean(selectedPaymentForRefund)}
        onClose={() => setSelectedPaymentForRefund(null)}
        onConfirm={handleConfirmRefund}
        refunding={refunding}
      />
    </div>
  );
}

export default PaymentsManagementPage;

