import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema } from "../../schemas/planSchemas.js";

/**
 * Modal form for creating and updating plan categories.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (data: Object) => Promise<void>,
 *   categoryToEdit: Object|null,
 *   submitting?: boolean
 * }} props
 */
export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  categoryToEdit = null,
  submitting = false,
}) {
  const isEditing = Boolean(categoryToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      isActive: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        reset({
          name: categoryToEdit.name || "",
          description: categoryToEdit.description || "",
          isActive: Boolean(categoryToEdit.is_active),
        });
      } else {
        reset({
          name: "",
          description: "",
          isActive: true,
        });
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !submitting) onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, categoryToEdit, reset, submitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 relative">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2
              id="category-modal-title"
              className="text-lg font-bold text-zinc-100 font-heading"
            >
              {isEditing ? "Edit Workout Category" : "Create Workout Category"}
            </h2>
            <p className="text-xs text-zinc-400">
              Categories group plans and isolate simultaneous pass validity.
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 space-y-4 text-xs"
        >
          {/* Category Name */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Category Name *
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Strength Training, Pilates, Yoga"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.name && (
              <p className="mt-1 text-rose-400 text-[11px]">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-zinc-300 font-medium mb-1">
              Description
            </label>
            <textarea
              rows={3}
              {...register("description")}
              placeholder="Describe this workout discipline or equipment area..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {errors.description && (
              <p className="mt-1 text-rose-400 text-[11px]">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Active status */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="cat-is-active"
              {...register("isActive")}
              className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
            />
            <label
              htmlFor="cat-is-active"
              className="text-zinc-300 font-medium cursor-pointer"
            >
              Active and eligible for plan assignment
            </label>
          </div>

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
              disabled={submitting}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditing ? "Save Changes" : "Create Category"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
