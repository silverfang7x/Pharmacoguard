import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface SideEffect {
  drug_name: string;
  side_effect: string;
  count: number;
}

interface Props {
  data: SideEffect[];
}

const COLORS = ["#818cf8", "#f472b6", "#34d399", "#f59e0b", "#22d3ee", "#a78bfa", "#fb923c"];

export default function SideEffectBarChart({ data }: Props) {
  // Flatten to label + count for the chart
  const chartData = data.map((d) => ({
    label: `${d.side_effect} (${d.drug_name})`,
    count: d.count,
  }));

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-5">
      <h3 className="text-sm font-bold text-white mb-4">
        Side Effect Frequency by Drug
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 90 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
            <XAxis type="number" stroke="#64748b" fontSize={11} />
            <YAxis
              type="category"
              dataKey="label"
              stroke="#64748b"
              fontSize={10}
              width={85}
              tick={{ fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#94a3b8" }}
              cursor={{ fill: "rgba(99,102,241,0.1)" }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
