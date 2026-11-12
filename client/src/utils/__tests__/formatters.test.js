import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatDateTime, getDaysRemaining } from "../formatters.js";

describe("formatters utilities", () => {
  describe("formatDate", () => {
    it("formats YYYY-MM-DD calendar dates accurately without timezone day-shifting", () => {
      // Must format as 20 Nov 2026 regardless of the test environment timezone
      expect(formatDate("2026-11-20")).toBe("20 Nov 2026");
      expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
    });

    it("handles null, undefined, or empty values with a dash fallback", () => {
      expect(formatDate(null)).toBe("—");
      expect(formatDate(undefined)).toBe("—");
      expect(formatDate("")).toBe("—");
    });

    it("returns original string if input is invalid date", () => {
      expect(formatDate("not-a-date")).toBe("not-a-date");
    });
  });

  describe("formatCurrency", () => {
    it("formats amounts in Indian Rupees (₹) with grouping", () => {
      expect(formatCurrency(2499)).toMatch(/₹\s?2,499/);
      expect(formatCurrency(0)).toMatch(/₹\s?0/);
    });
  });

  describe("getDaysRemaining", () => {
    it("returns 0 for null or past dates", () => {
      expect(getDaysRemaining(null)).toBe(0);
      expect(getDaysRemaining("2020-01-01")).toBe(0);
    });
  });
});

