import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Layers } from "lucide-react";

const PALETTE = ["#34D399", "#A3E635", "#38BDF8", "#F59E0B", "#A855F7", "#EC4899"];

/**
 * Custom tooltip component formatted for dark athletic and clean workspace aesthetics.
 */
function ChartTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-brand-dark/95 border border-brand-border text-text-inverted rounded-xl p-3 shadow-xl text-xs backdrop-blur-md">
        <div className="font-semibold text-sm mb-1">{data.name}</div>
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: data.payload.fill }}
          />
          <span className="text-text-muted">Active Passes:</span>
          <span className="font-bold text-emerald-accent">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Plan Category Distribution Donut Chart.
 *
 * @param {{
 *   categories?: Array<{ categoryId: number, categoryName: string, activeCount: number }>
 * }} props
 */
export function CategoryDistributionChart({ categories = [] }) {
  const chartData = categories
    .filter((cat) => cat.activeCount > 0)
    .map((cat, idx) => ({
      name: cat.categoryName,
      value: cat.activeCount,
      fill: PALETTE[idx % PALETTE.length],
    }));

  const totalActive = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-workspace-card border border-workspace-border rounded-2xl p-5 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold font-display text-text-primary">
            Plan Category Distribution
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Active subscriptions across gym workout domains
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-emerald-accent/10 text-emerald-accent text-xs font-semibold">
          {totalActive} Active {totalActive === 1 ? "Pass" : "Passes"}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-text-secondary border border-dashed border-workspace-border rounded-xl">
          <Layers className="w-10 h-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-text-primary">
            No Active Category Subscriptions
          </p>
          <p className="text-xs mt-1 max-w-xs">
            As members purchase passes across categories, distribution metrics will appear here.
          </p>
        </div>
      ) : (
        <div className="flex-1 min-h-[260px] w-full" aria-label="Category Distribution Donut Chart">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
                animationDuration={600}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default CategoryDistributionChart;

