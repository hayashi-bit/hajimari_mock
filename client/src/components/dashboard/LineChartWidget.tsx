import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { week: "W1", visitors: 1200, pageViews: 4500, sessions: 2100 },
  { week: "W2", visitors: 1900, pageViews: 6800, sessions: 3400 },
  { week: "W3", visitors: 1500, pageViews: 5200, sessions: 2700 },
  { week: "W4", visitors: 2400, pageViews: 8600, sessions: 4200 },
  { week: "W5", visitors: 2100, pageViews: 7400, sessions: 3800 },
  { week: "W6", visitors: 2800, pageViews: 9900, sessions: 5100 },
  { week: "W7", visitors: 3200, pageViews: 11200, sessions: 5900 },
  { week: "W8", visitors: 2900, pageViews: 10400, sessions: 5400 },
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
            {entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LineChartWidget() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-800">Traffic Overview</h3>
        <p className="text-slate-500 text-sm mt-0.5">
          Weekly visitors, page views &amp; sessions
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "16px", fontSize: "13px", color: "#64748b" }}
          />
          <Line
            type="monotone"
            dataKey="visitors"
            name="Visitors"
            stroke="#F87C62"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#F87C62", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="pageViews"
            name="Page Views"
            stroke="#0F3752"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#0F3752", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="sessions"
            name="Sessions"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#10b981", strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
