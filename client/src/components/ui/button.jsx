import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn.js";

const BUTTON_VARIANTS = {
  default:
    "bg-emerald-accent text-brand-dark font-semibold hover:bg-emerald-accent/90 shadow-sm active:translate-y-px",
  secondary:
    "bg-slate-800 text-text-primary font-medium hover:bg-slate-700/80 active:translate-y-px",
  outline:
    "border border-brand-border bg-transparent text-text-primary font-medium hover:bg-slate-800/60 active:translate-y-px",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-slate-800/50",
  danger:
    "bg-status-danger text-white font-semibold hover:bg-status-danger/90 active:translate-y-px",
};

const BUTTON_SIZES = {
  sm: "px-2.5 py-1.5 text-xs rounded-md gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
};

/**
 * Accessible gym-styled Button component with loading indicators and variant styling.
 */
export const Button = React.forwardRef(
  (
    {
      className,
      variant = "default",
      size = "md",
      isLoading = false,
      disabled = false,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-display transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-accent disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed select-none cursor-pointer",
          BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.default,
          BUTTON_SIZES[size] || BUTTON_SIZES.md,
          className,
        )}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
