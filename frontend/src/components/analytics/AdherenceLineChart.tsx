import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface DrugSeries {
  drug_name: string;
  data: { day: number; adherence_rate: number }[];
}

interface Props {
  series: DrugSeries[];
}

const COLORS = ["#818cf8", "#34d399", "#f59e0b", "#f472b6", "#22d3ee"];

export default function AdherenceLineChart({ series }: Props) {
  // Merge all series into a single data array keyed by day
  const dayMap = new Map<number, Record<string, number>>();

  for (const s of series) {
    for (const pt of s.data) {
      const existing = dayMap.get(pt.day) ?? { day: pt.day };
      existing[s.drug_name] = Math.round(pt.adherence_rate * 100);
      dayMap.set(pt.day, existing);
    }
  }

  const merged = Array.from(dayMap.values()).sort((a, b) => (a.day ?? 0) - (b.day ?? 0));

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-5">
      <h3 className="text-sm font-bold text-white mb-4">
        Adherence Over Time — Top Medications
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={merged} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="day"
              tickFormatter={(d: number) => `D${d}`}
              stroke="#64748b"
              fontSize={11}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v: number) => `${v}%`}
              stroke="#64748b"
              fontSize={11}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "#94a3b8" }}
              formatter={(value) => [`${value}%`, undefined]}
              labelFormatter={(day) => `Day ${day}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
            />
            {series.map((s, i) => (
              <Line
                key={s.drug_name}
                type="monotone"
                dataKey={s.drug_name}
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
