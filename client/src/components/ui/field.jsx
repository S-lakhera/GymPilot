import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../../utils/cn.js";

/**
 * Form Field Container.
 */
export function Field({ className, children, ...props }) {
  return (
    <div className={cn("space-y-1.5", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Form Field Label with accessible htmlFor pairing and optional required indicator.
 */
export function FieldLabel({
  className,
  htmlFor,
  required = false,
  children,
  ...props
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-xs font-semibold text-text-secondary uppercase tracking-wider",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span className="text-status-danger ml-1" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

/**
 * Form Field Description / Hint.
 */
export function FieldDescription({ className, id, children, ...props }) {
  return (
    <p
      id={id}
      className={cn("text-xs text-text-muted mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
}

/**
 * Form Field Error message with accessible role="alert".
 */
export function FieldError({ className, error, id, ...props }) {
  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error?.message;
  if (!errorMessage) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn(
        "text-xs font-medium text-status-danger mt-1 flex items-center gap-1.5 animate-slide-in",
        className,
      )}
      {...props}
    >
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{errorMessage}</span>
    </p>
  );
}
