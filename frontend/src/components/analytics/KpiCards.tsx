import { cn } from "@/lib/utils";
import { Users, TrendingUp, ShieldAlert, Bell } from "lucide-react";

interface Props {
  totalPatients: number;
  avgAdherence: number;
  ddiFlags: number;
  refillAlerts: number;
}

const cards = [
  { key: "patients", label: "Total Patients", icon: Users, color: "from-blue-600 to-indigo-600", iconBg: "bg-blue-500/20", textColor: "text-blue-400" },
  { key: "adherence", label: "Avg Adherence", icon: TrendingUp, color: "from-emerald-600 to-teal-600", iconBg: "bg-emerald-500/20", textColor: "text-emerald-400" },
  { key: "ddi", label: "Active DDI Flags", icon: ShieldAlert, color: "from-amber-600 to-orange-600", iconBg: "bg-amber-500/20", textColor: "text-amber-400" },
  { key: "refill", label: "Refill Alerts", icon: Bell, color: "from-rose-600 to-pink-600", iconBg: "bg-rose-500/20", textColor: "text-rose-400" },
] as const;

export default function KpiCards({ totalPatients, avgAdherence, ddiFlags, refillAlerts }: Props) {
  const values: Record<string, string> = {
    patients: totalPatients.toLocaleString(),
    adherence: `${(avgAdherence * 100).toFixed(1)}%`,
    ddi: ddiFlags.toLocaleString(),
    refill: refillAlerts.toLocaleString(),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, iconBg, textColor }) => (
        <div
          key={key}
          className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-5 flex items-center gap-4 hover:border-indigo-500/40 transition-colors"
        >
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
            <Icon className={cn("w-6 h-6", textColor)} />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-white tabular-nums mt-0.5">{values[key]}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
