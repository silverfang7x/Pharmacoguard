import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface Patient {
  patient_id: string;
  initials: string;
  adherence_rate: number;
  missed_doses_this_week: number;
  primary_drug: string;
}

interface Props {
  patients: Patient[];
}

function adherenceColor(rate: number) {
  if (rate >= 0.8) return "text-emerald-400";
  if (rate >= 0.6) return "text-amber-400";
  return "text-rose-400";
}

function adherenceBadgeBg(rate: number) {
  if (rate >= 0.8) return "bg-emerald-500/15 text-emerald-400";
  if (rate >= 0.6) return "bg-amber-500/15 text-amber-400";
  return "bg-rose-500/15 text-rose-400";
}

export default function LowAdherenceTable({ patients }: Props) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/80 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          Lowest Adherence This Week
        </h3>
        <span className="text-[10px] text-slate-400 font-medium">Anonymised</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="pb-2 pr-4 text-slate-400 font-medium uppercase tracking-wider">Patient</th>
              <th className="pb-2 pr-4 text-slate-400 font-medium uppercase tracking-wider">Drug</th>
              <th className="pb-2 pr-4 text-slate-400 font-medium uppercase tracking-wider text-right">Adherence</th>
              <th className="pb-2 text-slate-400 font-medium uppercase tracking-wider text-right">Missed</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-500">
                  No data available
                </td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.patient_id} className="border-b border-slate-700/40 hover:bg-slate-700/30 transition-colors">
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 text-[10px] font-bold">
                      {p.initials}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300">{p.primary_drug}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", adherenceBadgeBg(p.adherence_rate))}>
                      {(p.adherence_rate * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className={cn("py-2.5 text-right font-bold tabular-nums", adherenceColor(p.adherence_rate))}>
                    {p.missed_doses_this_week}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
