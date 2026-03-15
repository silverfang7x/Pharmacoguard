import { ShieldAlert, X, Stethoscope, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/* ────────────────────── types ────────────────────── */

export interface DDIInteraction {
  drug_a: string;
  drug_b: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  description: string;
  source: string;
}

export interface DDICheckResult {
  interactions: DDIInteraction[];
  overall_risk_score: string;
  llm_explanation: string;
}

interface DDIWarningModalProps {
  result: DDICheckResult;
  open: boolean;
  onClose: () => void;
  onConsultDoctor: () => void;
  onAcknowledgeRisk: () => void;
}

/* ───────────────── severity helpers ──────────────── */

const severityConfig: Record<
  DDIInteraction["severity"],
  { badge: string; ring: string; bg: string; label: string }
> = {
  CRITICAL: {
    badge: "bg-red-600 text-white",
    ring: "ring-red-500/40",
    bg: "bg-red-500/10",
    label: "Critical",
  },
  HIGH: {
    badge: "bg-orange-500 text-white",
    ring: "ring-orange-400/40",
    bg: "bg-orange-500/10",
    label: "High",
  },
  MODERATE: {
    badge: "bg-yellow-500 text-black",
    ring: "ring-yellow-400/40",
    bg: "bg-yellow-500/10",
    label: "Moderate",
  },
  LOW: {
    badge: "bg-slate-500 text-white",
    ring: "ring-slate-400/30",
    bg: "bg-slate-500/10",
    label: "Low",
  },
};

/* ─────────────────── component ──────────────────── */

export default function DDIWarningModal({
  result,
  open,
  onClose,
  onConsultDoctor,
  onAcknowledgeRisk,
}: DDIWarningModalProps) {
  if (!open) return null;

  return (
    /* backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* dark overlay */}
      <div
        className="absolute inset-0 bg-[#1a0a2e]/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal panel – glassmorphism */}
      <div
        className={cn(
          "relative z-10 w-full max-w-2xl mx-4 rounded-2xl overflow-hidden",
          "border border-white/10 shadow-2xl shadow-purple-900/50",
          "bg-white/[0.06] backdrop-blur-xl",
        )}
      >
        {/* ── red gradient header ── */}
        <div className="relative bg-gradient-to-r from-red-700 via-red-600 to-rose-500 px-6 py-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Drug Interaction Warning
              </h2>
              <p className="text-sm text-red-100">
                Overall risk:{" "}
                <span className="font-semibold">{result.overall_risk_score}</span>
                {" · "}
                {result.interactions.length} interaction
                {result.interactions.length !== 1 && "s"} found
              </p>
            </div>
          </div>
        </div>

        {/* ── scrollable body ── */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
          {/* interaction cards */}
          {result.interactions.map((ix, i) => {
            const cfg = severityConfig[ix.severity] ?? severityConfig.LOW;
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl p-4 ring-1 transition-all",
                  cfg.ring,
                  cfg.bg,
                )}
              >
                {/* drug pair header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-white">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-current opacity-70" />
                    <span className="font-semibold text-sm">
                      {ix.drug_a}
                      <span className="mx-2 opacity-50">↔</span>
                      {ix.drug_b}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide",
                      cfg.badge,
                    )}
                  >
                    {cfg.label}
                  </span>
                </div>
                {/* description */}
                <p className="text-sm text-white/70 leading-relaxed">{ix.description}</p>
                <p className="text-[11px] text-white/40 mt-2">Source: {ix.source}</p>
              </div>
            );
          })}

          {/* AI explanation */}
          {result.llm_explanation && (
            <div className="rounded-xl bg-white/[0.05] border border-white/10 p-4 mt-2">
              <h3 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                AI Safety Explanation
              </h3>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {result.llm_explanation}
              </p>
            </div>
          )}
        </div>

        {/* ── footer CTAs ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10 bg-white/[0.03]">
          <button
            onClick={onConsultDoctor}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4",
              "bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold",
              "hover:from-blue-500 hover:to-indigo-500 transition-all shadow-lg shadow-blue-700/30",
            )}
          >
            <Stethoscope className="h-4 w-4" />
            Consult Doctor
          </button>

          <button
            onClick={onAcknowledgeRisk}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4",
              "bg-white/10 text-white/80 text-sm font-semibold",
              "hover:bg-white/20 transition-all ring-1 ring-white/10",
            )}
          >
            <ShieldAlert className="h-4 w-4" />
            Acknowledge Risk
          </button>
        </div>
      </div>
    </div>
  );
}
