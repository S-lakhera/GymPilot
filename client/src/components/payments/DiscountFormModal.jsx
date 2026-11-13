import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discountFormSchema } from "../../schemas/discountSchemas.js";

/**
 * Modal form for creating and updating promotional discount coupons.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: Object) => Promise<void>,
 *   discountToEdit: Object|null,
 *   submitting?: boolean
 * }} props
 */
export function DiscountFormModal({
  isOpen,
  onClose,
  onSubmit,
  discountToEdit = null,
  submitting = false,
}) {
  const isEditing = Boolean(discountToEdit);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      discountType: "PERCENTAGE",
      discountValue: 20,
      maxDiscountAmount: 500,
      minPurchaseAmount: 1000,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      usageLimit: 100,
      isActive: true,
    },
  });

  const selectedType = watch("discountType");

  useEffect(() => {
    if (isOpen) {
      if (discountToEdit) {
        reset({
          code: discountToEdit.code || "",
          name: discountToEdit.name || "",
          description: discountToEdit.description || "",
          discountType: discountToEdit.discount_type || "PERCENTAGE",
          discountValue: Number(discountToEdit.discount_value) || 0,
          maxDiscountAmount: discountToEdit.max_discount_amount
            ? Number(discountToEdit.max_discount_amount)
            : null,
          minPurchaseAmount: Number(discountToEdit.min_purchase_amount) || 0,
          startDate: discountToEdit.start_date
            ? String(discountToEdit.start_date).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          endDate: discountToEdit.end_date
            ? String(discountToEdit.end_date).slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          usageLimit: discountToEdit.usage_limit
            ? Number(discountToEdit.usage_limit)
            : null,
          isActive: Boolean(discountToEdit.is_active),
        });
      } else {
        reset({
          code: "",
          name: "",
          description: "",
          discountType: "PERCENTAGE",
          discountValue: 20,
          maxDiscountAmount: 500,
          minPurchaseAmount: 1000,
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          usageLimit: 100,
          isActive: true,
        });
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !submitting) onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, discountToEdit, reset, submitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h2 id="discount-modal-title" className="text-lg font-bold text-zinc-100 font-heading">
              {isEditing ? "Edit Promotional Coupon" : "Create Promotional Coupon"}
            </h2>
            <p className="text-xs text-zinc-400">
              Configure discount mechanics, ceiling caps, and validity duration.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-zinc-400 hover:text-zinc-200 text-lg leading-none p-1 rounded hover:bg-zinc-800"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          {/* Code & Name Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Coupon Code *</label>
              <input
                type="text"
                {...register("code")}
                placeholder="e.g. SUMMER25"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 uppercase font-mono placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.code && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.code.message}</p>
              )}
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Coupon Name *</label>
              <input
                type="text"
                {...register("name")}
                placeholder="e.g. Summer Fitness Kickoff"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.name && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.name.message}</p>
              )}
            </div>
          </div>

          {/* Discount Type & Value Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Discount Type *</label>
              <select
                {...register("discountType")}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="PERCENTAGE">PERCENTAGE (%)</option>
                <option value="FIXED">FIXED (₹ INR)</option>
              </select>
              {errors.discountType && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.discountType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">
                {selectedType === "PERCENTAGE" ? "Percentage Off (%) *" : "Fixed Amount Off (₹) *"}
              </label>
              <input
                type="number"
                step="any"
                {...register("discountValue")}
                placeholder={selectedType === "PERCENTAGE" ? "20" : "500"}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.discountValue && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.discountValue.message}</p>
              )}
            </div>
          </div>

          {/* Max Cap (if percentage) & Min Purchase Row */}
          <div className="grid grid-cols-2 gap-4">
            {selectedType === "PERCENTAGE" && (
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Max Discount Cap (₹)</label>
                <input
                  type="number"
                  step="any"
                  {...register("maxDiscountAmount")}
                  placeholder="e.g. 500 (blank for unlimited)"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {errors.maxDiscountAmount && (
                  <p className="mt-1 text-rose-400 text-[11px]">{errors.maxDiscountAmount.message}</p>
                )}
              </div>
            )}

            <div className={selectedType !== "PERCENTAGE" ? "col-span-2" : ""}>
              <label className="block text-zinc-300 font-medium mb-1">Min Purchase Amount (₹)</label>
              <input
                type="number"
                step="any"
                {...register("minPurchaseAmount")}
                placeholder="0"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.minPurchaseAmount && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.minPurchaseAmount.message}</p>
              )}
            </div>
          </div>

          {/* Start Date & End Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Start Date *</label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.startDate && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">End Date *</label>
              <input
                type="date"
                {...register("endDate")}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.endDate && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Usage Limit */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Total Usage Limit (Claims)</label>
            <input
              type="number"
              {...register("usageLimit")}
              placeholder="e.g. 100 (leave blank for unlimited)"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.usageLimit && (
              <p className="mt-1 text-rose-400 text-[11px]">{errors.usageLimit.message}</p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="discount-is-active"
              {...register("isActive")}
              className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="discount-is-active" className="text-zinc-300 font-medium cursor-pointer">
              Active and redeemable at checkout
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Coupon"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

