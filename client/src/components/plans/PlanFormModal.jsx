import React, { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planFormSchema } from "../../schemas/planSchemas.js";
import { useNetworkStatus } from "../../hooks/useNetworkStatus.js";

/**
 * Modal form for creating and updating membership plans.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: Object) => Promise<void>,
 *   planToEdit: Object|null,
 *   categories: Array<Object>,
 *   submitting?: boolean,
 *   error?: string|null
 * }} props
 */
export function PlanFormModal({
  isOpen,
  onClose,
  onSubmit,
  planToEdit = null,
  categories = [],
  submitting = false,
  error = null,
}) {
  const isEditing = Boolean(planToEdit);
  const previouslyFocusedElementRef = useRef(null);
  const dialogRef = useRef(null);
  const wasOpenRef = useRef(false);
  const { isOnline } = useNetworkStatus();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: categories[0]?.id || "",
      durationDays: 30,
      price: 1999,
      isActive: true,
    },
  });

  // Form initialization and focus lifecycle
  useEffect(() => {
    if (isOpen) {
      if (!wasOpenRef.current) {
        previouslyFocusedElementRef.current = document.activeElement;
        setTimeout(() => {
          const firstInput = dialogRef.current?.querySelector("input:not([disabled])");
          if (firstInput) {
            firstInput.focus();
          } else {
            dialogRef.current?.focus();
          }
        }, 0);
      }

      if (planToEdit) {
        reset({
          name: planToEdit.name || "",
          description: planToEdit.description || "",
          categoryId: planToEdit.category_id || categories[0]?.id || "",
          durationDays: planToEdit.duration_days || 30,
          price: Number(planToEdit.price) || 0,
          isActive: Boolean(planToEdit.is_active),
        });
      } else {
        reset({
          name: "",
          description: "",
          categoryId: categories[0]?.id || "",
          durationDays: 30,
          price: 1999,
          isActive: true,
        });
      }
    }
    wasOpenRef.current = isOpen;

    if (!isOpen && previouslyFocusedElementRef.current) {
      if (typeof previouslyFocusedElementRef.current.focus === "function") {
        previouslyFocusedElementRef.current.focus();
      }
      previouslyFocusedElementRef.current = null;
    }
  }, [isOpen, planToEdit, categories, reset]);

  // Unmount cleanup to guarantee focus restoration
  useEffect(() => {
    return () => {
      if (previouslyFocusedElementRef.current) {
        if (typeof previouslyFocusedElementRef.current.focus === "function") {
          previouslyFocusedElementRef.current.focus();
        }
        previouslyFocusedElementRef.current = null;
      }
    };
  }, []);

  // When submitting, keep focus inside dialog
  useEffect(() => {
    if (submitting && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [submitting]);

  // Separate Escape key and Tab trap listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !submitting) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length || submitting) {
          e.preventDefault();
          dialogRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === first ||
            document.activeElement === dialogRef.current
          ) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (
            document.activeElement === last ||
            document.activeElement === dialogRef.current
          ) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden focus:outline-none"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 id="plan-modal-title" className="text-lg font-bold text-zinc-100 font-heading">
              {isEditing ? "Edit Membership Plan" : "Create New Membership Plan"}
            </h2>
            <p className="text-xs text-zinc-400">
              Configure plan pricing, category, and access duration.
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

        {error && (
          <div
            role="alert"
            className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium"
          >
            {typeof error === "string" ? error : error.message || "Failed to save plan."}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          {/* Plan Name */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Plan Name *</label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. CrossFit Unlimited Monthly"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.name && (
              <p className="mt-1 text-rose-400 text-[11px]">{errors.name.message}</p>
            )}
          </div>

          {/* Category & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-300 font-medium mb-1">Plan Category *</label>
              <select
                {...register("categoryId")}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-zinc-300 font-medium mb-1">Duration (Days) *</label>
              <input
                type="number"
                {...register("durationDays")}
                placeholder="30"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {errors.durationDays && (
                <p className="mt-1 text-rose-400 text-[11px]">{errors.durationDays.message}</p>
              )}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Price (₹ INR) *</label>
            <input
              type="number"
              step="any"
              {...register("price")}
              placeholder="1999"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.price && (
              <p className="mt-1 text-rose-400 text-[11px]">{errors.price.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">Description</label>
            <textarea
              rows={3}
              {...register("description")}
              placeholder="What access privileges and perks are included in this plan?"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.description && (
              <p className="mt-1 text-rose-400 text-[11px]">{errors.description.message}</p>
            )}
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="plan-is-active"
              {...register("isActive")}
              className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
            />
            <label htmlFor="plan-is-active" className="text-zinc-300 font-medium cursor-pointer">
              Active and visible in Member Plan Catalog
            </label>
          </div>

          {!isOnline && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Plan configuration mutations require an active internet connection.
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
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
              disabled={submitting || !isOnline}
              title={!isOnline ? "Network offline - plan updates require an internet connection" : undefined}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Plan"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

