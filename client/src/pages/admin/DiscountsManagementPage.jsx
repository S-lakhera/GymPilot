import React, { useState } from "react";
import { useDiscounts } from "../../hooks/useDiscounts.js";
import { DiscountTable } from "../../components/payments/DiscountTable.jsx";
import { DiscountFormModal } from "../../components/payments/DiscountFormModal.jsx";

/**
 * Admin Promotional Discounts & Coupons Management Workspace.
 */
export function DiscountsManagementPage() {
  const {
    discounts,
    filteredDiscounts,
    loading,
    submitting,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    createDiscount,
    updateDiscount,
    toggleDiscountStatus,
    refetch,
  } = useDiscounts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discountToEdit, setDiscountToEdit] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const handleOpenCreate = () => {
    setDiscountToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (discount) => {
    setDiscountToEdit(discount);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (discountToEdit) {
        await updateDiscount(discountToEdit.id, formData);
        setFeedback({
          type: "success",
          message: `Coupon "${formData.code}" updated successfully.`,
        });
      } else {
        await createDiscount(formData);
        setFeedback({
          type: "success",
          message: `Coupon "${formData.code}" created successfully.`,
        });
      }
      setIsModalOpen(false);
      setDiscountToEdit(null);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to save discount coupon.",
      });
    }
  };

  const handleToggleStatus = async (discount) => {
    const nextState = !Boolean(discount.is_active);
    try {
      await toggleDiscountStatus(discount.id, nextState);
      setFeedback({
        type: "success",
        message: `Coupon "${discount.code}" is now ${nextState ? "active" : "deactivated"}.`,
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update coupon status.",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-emerald-500/20">
            Promotional Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 font-heading tracking-tight">
            Promotional Discounts & Coupons
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create promotional codes, configure percentage and flat discounts, and monitor coupon redemptions.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/20"
        >
          + Create Coupon Code
        </button>
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupons by code or name..."
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

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "all"
                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "active"
                  ? "bg-emerald-500 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("inactive")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === "inactive"
                  ? "bg-zinc-700 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Archived
            </button>
          </div>

          <span className="text-xs text-zinc-400 font-mono bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-700/50">
            {filteredDiscounts.length} coupon{filteredDiscounts.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-sm">
          <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-3" />
          Loading promotional coupons...
        </div>
      ) : (
        <DiscountTable
          discounts={filteredDiscounts}
          onEditDiscount={handleOpenEdit}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {/* Create / Edit Modal */}
      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDiscountToEdit(null);
        }}
        onSubmit={handleSubmit}
        discountToEdit={discountToEdit}
        submitting={submitting}
      />
    </div>
  );
}

export default DiscountsManagementPage;

