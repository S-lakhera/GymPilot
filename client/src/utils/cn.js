import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and cleanly resolves conflicting Tailwind CSS utilities.
 * Standard foundation utility for shadcn/ui components and custom variants.
 *
 * @param {...any} inputs - Class names, expressions, objects, or arrays
 * @returns {string} Clean merged class string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;
