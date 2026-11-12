import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatCurrency } from "../../utils/formatters.js";

/**
 * Custom tooltip for the Financial Comparative Bar Chart.
 */
function FinancialTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-brand-dark/95 border border-brand-border text-text-inverted rounded-xl p-3 shadow-xl text-xs backdrop-blur-md min-w-[180px]">
        <div className="font-bold text-sm text-text-inverted mb-2 border-b border-brand-border/60 pb-1">
          {label} Period
        </div>
        <div className="space-y-1.5">
          {payload.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm inline-block"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-text-muted">{item.name}:</span>
              </div>
              <span className="font-semibold text-text-inverted">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Financial Comparative Chart.
 * Visualizes backend period financials (Today, Month-to-Date, and All-Time)
 * comparing Gross Collections, Completed Refunds, and Net Revenue.
 *
 * @param {{
 *   financials?: {
 *     grossRevenue: number,
 *     grossRevenueMtd: number,
 *     grossRevenueToday: number,
 *     totalRefunded: number,
 *     refundedMtd: number,
 *     refundedToday: number,
 *     netRevenue: number,
 *     netRevenueMtd: number,
 *     netRevenueToday: number
 *   }
 * }} props
 */
export function FinancialComparativeChart({ financials }) {
  const data = [
    {
      period: "Today",
      "Gross Collections": Number(financials?.grossRevenueToday || 0),
      "Completed Refunds": Number(financials?.refundedToday || 0),
      "Net Revenue": Number(financials?.netRevenueToday || 0),
    },
    {
      period: "MTD",
      "Gross Collections": Number(financials?.grossRevenueMtd || 0),
      "Completed Refunds": Number(financials?.refundedMtd || 0),
      "Net Revenue": Number(financials?.netRevenueMtd || 0),
    },
    {
      period: "All-Time",
      "Gross Collections": Number(financials?.grossRevenue || 0),
      "Completed Refunds": Number(financials?.totalRefunded || 0),
      "Net Revenue": Number(financials?.netRevenue || 0),
    },
  ];

  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold font-display text-text-primary">
            Financial Ledger Overview
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Gross collections vs refunds vs net revenue across operating periods
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] w-full" aria-label="Financial Comparative Bar Chart">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={{ stroke: "#CBD5E1" }}
              tick={{ fill: "#64748B", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />
            <Tooltip content={<FinancialTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
            />
            <Bar
              dataKey="Gross Collections"
              fill="#94A3B8"
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
            />
            <Bar
              dataKey="Completed Refunds"
              fill="#F43F5E"
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
            />
            <Bar
              dataKey="Net Revenue"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default FinancialComparativeChart;
