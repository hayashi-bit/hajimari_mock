"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Jan", revenue: 4200, expenses: 2800 },
  { month: "Feb", revenue: 5800, expenses: 3200 },
  { month: "Mar", revenue: 4900, expenses: 2900 },
  { month: "Apr", revenue: 6800, expenses: 3800 },
  { month: "May", revenue: 7200, expenses: 4100 },
  { month: "Jun", revenue: 6500, expenses: 3600 },
  { month: "Jul", revenue: 8100, expenses: 4500 },
  { month: "Aug", revenue: 7600, expenses: 4200 },
  { month: "Sep", revenue: 9200, expenses: 5100 },
  { month: "Oct", revenue: 8800, expenses: 4800 },
  { month: "Nov", revenue: 10200, expenses: 5600 },
  { month: "Dec", revenue: 11500, expenses: 6200 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
      <p className="text-slate-300 text-sm font-medium mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-medium">
            ${entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BarChartWidget() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-800">
          Revenue vs Expenses
        </h3>
        <p className="text-slate-500 text-sm mt-0.5">Monthly financial overview</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend
            wrapperStyle={{ paddingTop: "16px", fontSize: "13px", color: "#64748b" }}
          />
          <Bar dataKey="revenue" name="Revenue" fill="#F87C62" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
