import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { refundFormSchema } from "../../schemas/refundSchemas.js";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Modal dialog for processing payment refunds with ceiling boundary validation.
 *
 * @param {{
 *   payment: Object|null,
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (payload: { paymentId: number, amount: number, reason: string }) => Promise<void>,
 *   refunding?: boolean
 * }} props
 */
export function IssueRefundModal({
  payment,
  isOpen,
  onClose,
  onConfirm,
  refunding = false,
}) {
  const amount = payment ? Number(payment.amount) || 0 : 0;
  const refundedAmount = payment ? Number(payment.refunded_amount) || 0 : 0;
  const remainingCeiling = Math.max(0, amount - refundedAmount);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(refundFormSchema),
    defaultValues: {
      amount: remainingCeiling,
      reason: "",
    },
  });

  useEffect(() => {
    if (isOpen && payment) {
      reset({
        amount: remainingCeiling,
        reason: "",
      });

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !refunding) onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, payment, remainingCeiling, reset, refunding, onClose]);

  if (!isOpen || !payment) return null;

  const handleFormSubmit = async (data) => {
    if (Number(data.amount) > remainingCeiling) {
      setError("amount", {
        type: "manual",
        message: `Refund amount cannot exceed the remaining balance of ${formatCurrency(remainingCeiling)}.`,
      });
      return;
    }

    await onConfirm({
      paymentId: payment.id,
      amount: Number(data.amount),
      reason: data.reason,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="refund-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !refunding) onClose();
      }}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 id="refund-modal-title" className="text-lg font-bold text-zinc-100 font-heading">
              Issue Payment Refund
            </h2>
            <p className="text-xs text-zinc-400">
              Transaction Ref #{payment.transaction_reference || payment.id}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={refunding}
            className="text-zinc-400 hover:text-zinc-200 text-lg leading-none p-1 rounded hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        {/* Financial Ceiling Balance Breakdown */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Original Gross Paid:</span>
            <span className="font-semibold text-zinc-200">{formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Previously Refunded:</span>
            <span className="font-semibold text-amber-400">{formatCurrency(refundedAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold">
            <span className="text-zinc-300">Remaining Refundable Balance:</span>
            <span className="text-emerald-400">{formatCurrency(remainingCeiling)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="mt-4 space-y-4 text-xs">
          {/* Refund Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-zinc-300 font-medium">Refund Amount (₹ INR) *</label>
              <button
                type="button"
                onClick={() => setValue("amount", remainingCeiling)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Full Remaining
              </button>
            </div>
            <input
              type="number"
              step="any"
              max={remainingCeiling}
              {...register("amount")}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.amount && (
              <p className="mt-1 text-rose-400 text-[11px]">{errors.amount.message}</p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Reason for Refund *</label>
            <textarea
              rows={3}
              {...register("reason")}
              placeholder="e.g. Member relocated; Customer service concession..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.reason && (
              <p className="mt-1 text-rose-400 text-[11px]">{errors.reason.message}</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={refunding}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={refunding || remainingCeiling <= 0}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {refunding ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm Refund</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
