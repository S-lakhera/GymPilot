/**
 * Currency and Date formatters formatted for GymPilot standard display.
 */

/**
 * Format numeric amount to Indian Rupee currency (₹).
 * E.g. 2299 -> "₹2,299"
 *
 * @param {number|string} amount
 * @param {string} currency - default 'INR'
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = "INR") {
  const numeric = Number(amount) || 0;
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(numeric);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(numeric);
}

/**
 * Format standard date to readable string (e.g. "15 Oct 2026").
 *
 * @param {string|Date} dateVal
 * @returns {string} Formatted date string
 */
export function formatDate(dateVal) {
  if (!dateVal) return "—";

  // Handle YYYY-MM-DD calendar date strings directly using UTC to avoid timezone day shifts
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal.trim())) {
    const [year, month, day] = dateVal.trim().split("-").map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    if (isNaN(utcDate.getTime())) return String(dateVal);

    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(utcDate);
  }

  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Format standard date and time string (e.g. "15 Oct 2026, 04:30 PM").
 *
 * @param {string|Date} dateVal
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(dateVal) {
  if (!dateVal) return "—";
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

/**
 * Calculate calendar days remaining between target end date and current date.
 *
 * @param {string|Date} endDateVal
 * @returns {number} Non-negative number of days remaining
 */
export function getDaysRemaining(endDateVal) {
  if (!endDateVal) return 0;
  const target = new Date(endDateVal);
  const now = new Date();
  // Strip time for clean day comparison
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
