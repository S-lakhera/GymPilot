import React from "react";
import { Tag, Check, X, Loader2 } from "lucide-react";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Promotional Discount Coupon Input with real-time validation and savings badge.
 *
 * @param {{
 *   discountCode: string,
 *   quote: Object|null,
 *   isLoading: boolean,
 *   error: string|null,
 *   onApply: (code: string) => void,
 *   onClear: () => void
 * }} props
 */
export function DiscountCouponInput({
  discountCode,
  quote,
  isLoading,
  error,
  onApply,
  onClear,
}) {
  const [inputVal, setInputVal] = React.useState(discountCode || "");

  const appliedDiscountCode =
    quote?.discountCode || quote?.discount?.code || "";
  const hasDiscount = Boolean(appliedDiscountCode && quote?.discountAmount > 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onApply(inputVal.trim().toUpperCase());
    }
  };

  const handleClear = () => {
    setInputVal("");
    onClear();
  };

  return (
    <div className="space-y-2">
      <label htmlFor="promotional-discount-input" className="text-xs font-semibold text-text-primary block">
        Promotional Discount Code
      </label>

      {hasDiscount ? (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
          <div className="flex items-center gap-2 text-emerald-800">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold tracking-wider uppercase text-emerald-900">
                {appliedDiscountCode}
              </span>{" "}
              applied — Saved{" "}
              <strong className="text-emerald-700 font-bold">
                {formatCurrency(quote.discountAmount)}
              </strong>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-emerald-700 hover:text-emerald-900 font-semibold p-1 transition-colors"
            title="Remove discount code"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <input
              id="promotional-discount-input"
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value.toUpperCase())}
              placeholder="e.g. WELCOME10"
              disabled={isLoading}
              aria-describedby={error ? "discount-coupon-error" : undefined}
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-workspace border border-workspace-border text-text-primary uppercase tracking-wider focus:ring-2 focus:ring-emerald-accent/50 focus:border-emerald-accent outline-none transition-all placeholder:normal-case placeholder:tracking-normal"
            />
          </div>
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-surface hover:bg-brand-dark text-text-inverted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Apply
          </button>
        </form>
      )}

      {error && (
        <p id="discount-coupon-error" className="text-[11px] text-status-danger font-medium flex items-center gap-1 mt-1">
          <X className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}

export default DiscountCouponInput;
