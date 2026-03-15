import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Loader2,
  ChevronRight,
} from "lucide-react";

/* ── Types (mirrors backend schemas) ── */

interface DrugWarning {
  drug_name: string;
  current_phase: string;
  cycle_day: number;
  risk_level: string;
  personalized_warning_text: string;
}

interface ForecastDay {
  date: string;
  predicted_phase: string;
  cycle_day: number;
  drug_alerts: string[];
  sensitivity_level: string;
}

/* ── Risk badge colours ── */

const RISK_STYLES: Record<string, { bg: string; text: string; ring: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-300" },
  high:     { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300" },
  moderate: { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300" },
  low:      { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300" },
};

const SENS_DOT: Record<string, string> = {
  high:     "bg-red-400",
  elevated: "bg-amber-400",
  normal:   "bg-emerald-400",
};

const PHASE_COLOR: Record<string, string> = {
  menstrual:  "text-rose-500",
  follicular: "text-pink-500",
  ovulatory:  "text-violet-500",
  luteal:     "text-purple-500",
};

/* ── Drug Sensitivity Warnings Panel ── */

interface WarningsProps {
  drugIds: string[];
}

export function DrugWarningsPanel({ drugIds }: WarningsProps) {
  const [warnings, setWarnings] = useState<DrugWarning[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!drugIds.length) return;
    setLoading(true);
    Promise.all(
      drugIds.map((id) =>
        api
          .get<DrugWarning>(`/hormone/cycle-drug-warning/${id}`)
          .then((r) => r.data)
          .catch(() => null),
      ),
    )
      .then((results) => setWarnings(results.filter(Boolean) as DrugWarning[]))
      .finally(() => setLoading(false));
  }, [drugIds]);

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 space-y-4">
      <h3 className="text-sm font-bold text-amber-700 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        Drug Sensitivity Warnings
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
        </div>
      ) : warnings.length === 0 ? (
        <div className="text-center py-6 px-4 bg-white/60 rounded-xl border border-amber-100">
          <div className="text-3xl mb-2">🛡️</div>
          <p className="text-sm font-semibold text-amber-700">All clear for your current phase</p>
        </div>
      ) : (
        <div className="space-y-3">
          {warnings.map((w) => {
            const risk = RISK_STYLES[w.risk_level] ?? RISK_STYLES["low"]!;
            return (
              <div
                key={w.drug_name}
                className={cn(
                  "rounded-xl p-3 border transition-all",
                  w.risk_level === "critical" || w.risk_level === "high"
                    ? "border-red-200 bg-red-50/50"
                    : "border-purple-100 bg-white/60",
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    {w.drug_name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ring-1",
                      risk.bg, risk.text, risk.ring,
                    )}
                  >
                    {w.risk_level}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {w.personalized_warning_text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── 5-Day Forecast Card ── */

interface ForecastProps {
  drugs?: string;
}

export function ForecastCard({ drugs }: ForecastProps) {
  const [days, setDays] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = drugs ? `?drugs=${encodeURIComponent(drugs)}` : "";
    api
      .get<{ days: ForecastDay[] }>(`/hormone/forecast${params}`)
      .then((r) => setDays(r.data.days))
      .catch(() => setDays([]))
      .finally(() => setLoading(false));
  }, [drugs]);

  const formatDate = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5 space-y-4">
      <h3 className="text-sm font-bold text-purple-800 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-purple-600" />
        Next 5 Days Forecast
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
        </div>
      ) : days.length === 0 ? (
        <div className="text-center py-6 px-4 bg-white/60 rounded-xl border border-purple-100 flex flex-col items-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-sm font-semibold text-purple-800 mb-3">Start logging your cycle to unlock predictions</p>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-colors">
            Log Today
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => (
            <div
              key={day.date}
              className="flex items-center gap-3 rounded-xl bg-white/60 border border-purple-100/60 p-3 transition-all hover:shadow-sm"
            >
              {/* Sensitivity dot */}
              <div className={cn(
                "w-2.5 h-2.5 rounded-full flex-shrink-0",
                SENS_DOT[day.sensitivity_level] ?? SENS_DOT.normal,
              )} />

              {/* Date & phase */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">
                    {formatDate(day.date)}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    PHASE_COLOR[day.predicted_phase] ?? "text-purple-500",
                  )}>
                    {day.predicted_phase}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Day {day.cycle_day}
                  </span>
                </div>

                {/* Alerts */}
                {day.drug_alerts.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {day.drug_alerts.map((alert, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <span className="text-[11px] text-muted-foreground leading-snug">
                          {alert}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
