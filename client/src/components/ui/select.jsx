import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn.js";

/**
 * Accessible Dark Athletic Select primitive.
 */
export const Select = React.forwardRef(
  ({ className, hasError = false, children, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          aria-invalid={hasError ? "true" : undefined}
          className={cn(
            "w-full appearance-none rounded-lg bg-brand-dark/60 border text-text-primary text-sm px-3.5 py-2.5 pr-9 transition-colors duration-150",
            "focus:outline-none focus:ring-1",
            hasError
              ? "border-status-danger focus:border-status-danger focus:ring-status-danger/40"
              : "border-brand-border focus:border-emerald-accent focus:ring-emerald-accent/40",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <div className="absolute right-3 pointer-events-none text-text-muted">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
