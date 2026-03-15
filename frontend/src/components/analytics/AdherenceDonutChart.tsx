import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface Bucket {
  bucket: string;
  count: number;
}

interface Props {
  data: Bucket[];
}

const COLORS = ["#818cf8", "#6366f1", "#a78bfa", "#c084fc", "#e879f9"];

export default function AdherenceDonutChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-5">
      <h3 className="text-sm font-bold text-white mb-4">
        Patient Adherence Distribution
      </h3>
      <div className="h-72 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="bucket"
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
              formatter={(value, name) => [`${value} patients`, name]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              formatter={(value: string) => <span style={{ color: "#94a3b8" }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginTop: -16 }}>
          <div className="text-center">
            <p className="text-2xl font-bold text-white tabular-nums">{total}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Patients</p>
          </div>
        </div>
      </div>
    </div>
  );
}
