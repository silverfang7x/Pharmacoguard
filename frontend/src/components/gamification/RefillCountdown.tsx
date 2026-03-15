import { cn } from "@/lib/utils";
import { Timer, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Prediction {
  drug_name: string;
  estimated_empty_date: string;
  confidence_score: number;
  days_remaining: number;
  should_alert: boolean;
}

interface Props {
  predictions: Prediction[];
  loading?: boolean;
}

function urgencyColor(days: number) {
  if (days <= 3) return { bg: "bg-red-50 border-red-200", text: "text-red-600", icon: AlertTriangle, ring: "ring-red-300/40", dot: "bg-red-500" };
  if (days <= 7) return { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-600", icon: Clock, ring: "ring-yellow-300/40", dot: "bg-yellow-500" };
  return { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-600", icon: CheckCircle, ring: "ring-emerald-300/40", dot: "bg-emerald-500" };
}

export default function RefillCountdown({ predictions, loading }: Props) {
  return (
    <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-cyan-50/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Timer className="w-4 h-4 text-blue-500" />
          Refill Countdown
        </h3>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
          AI Predicted
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 opacity-30">💊</div>
          <p className="text-xs text-muted-foreground">
            No active prescriptions to predict refills for.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred) => {
            const uc = urgencyColor(pred.days_remaining);
            const Icon = uc.icon;
            return (
              <div
                key={pred.drug_name}
                className={cn(
                  "rounded-xl border p-3 ring-1 transition-shadow hover:shadow-md",
                  uc.bg, uc.ring,
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">
                      {pred.drug_name}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Empty by{" "}
                      {format(parseISO(pred.estimated_empty_date), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Icon className={cn("w-4 h-4", uc.text)} />
                    <span className={cn("text-lg font-extrabold tabular-nums", uc.text)}>
                      {pred.days_remaining}
                    </span>
                    <span className={cn("text-[10px] font-medium", uc.text)}>
                      days
                    </span>
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-black/5 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", uc.dot)}
                      style={{ width: `${Math.min(pred.confidence_score * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-medium tabular-nums">
                    {(pred.confidence_score * 100).toFixed(0)}% conf
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
