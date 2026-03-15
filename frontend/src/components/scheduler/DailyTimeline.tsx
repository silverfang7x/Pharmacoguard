import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Clock, Pill, ChevronDown, ChevronUp } from "lucide-react";

/* ────────────────────── types ────────────────────── */

export interface SlotMedication {
  name: string;
  dosage: string;
  color: string;
}

export interface TimeSlot {
  time: string;
  label: string;
  medications: SlotMedication[];
  taken: boolean;
  taken_at: string | null;
}

interface DailyTimelineProps {
  date: string;
  slots: TimeSlot[];
  progress: number;
  onMarkTaken: (slotTime: string) => void;
  loading?: boolean;
}

/* ──────────── time-window helpers ──────────── */

const SLOT_WINDOWS: Record<string, [number, number]> = {
  "08:00": [6, 10],
  "13:00": [12, 14],
  "18:00": [17, 19],
  "22:00": [21, 23],
};

function getSlotStatus(
  slot: TimeSlot,
): "taken" | "upcoming" | "current" | "missed" {
  if (slot.taken) return "taken";
  const now = new Date();
  const currentHour = now.getHours();
  const window = SLOT_WINDOWS[slot.time];
  if (!window) return "upcoming";
  const [start, end] = window;
  if (currentHour >= start && currentHour < end) return "current";
  if (currentHour >= end) return "missed";
  return "upcoming";
}

/* quality-of-life: label + time ranges for display */
const WINDOW_LABELS: Record<string, string> = {
  "08:00": "6:00 – 10:00 AM",
  "13:00": "12:00 – 2:00 PM",
  "18:00": "5:00 – 7:00 PM",
  "22:00": "9:00 – 11:00 PM",
};

/* ─────────────────── component ──────────────────── */

export default function DailyTimeline({
  date,
  slots,
  progress,
  onMarkTaken,
  loading,
}: DailyTimelineProps) {
  return (
    <div className="space-y-6">
      {/* ── progress bar ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Today's Progress</span>
          <span className="tabular-nums font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{date}</p>
      </div>

      {/* ── vertical timeline ── */}
      <div className="relative pl-8">
        {/* timeline spine */}
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

        {slots.map((slot, i) => (
          <TimelineSlotCard
            key={slot.time}
            slot={slot}
            isLast={i === slots.length - 1}
            onMarkTaken={onMarkTaken}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}

/* ── individual slot card ── */

function TimelineSlotCard({
  slot,
  isLast,
  onMarkTaken,
  loading,
}: {
  slot: TimeSlot;
  isLast: boolean;
  onMarkTaken: (slotTime: string) => void;
  loading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = getSlotStatus(slot);

  const dotColor = {
    taken: "bg-emerald-500",
    current: "bg-primary animate-pulse shadow-[0_0_12px_hsl(161,78%,40%)]",
    upcoming: "bg-muted-foreground/40",
    missed: "bg-destructive",
  }[status];

  const cardBorder = {
    taken: "border-emerald-500/30 bg-emerald-500/[0.04]",
    current: "border-primary/40 bg-primary/[0.06] shadow-[0_0_24px_-4px_hsl(161,78%,40%,0.15)]",
    upcoming: "border-border bg-card",
    missed: "border-destructive/30 bg-destructive/[0.04]",
  }[status];

  return (
    <div className={cn("relative mb-6", isLast && "mb-0")}>
      {/* dot on spine */}
      <div
        className={cn(
          "absolute -left-8 top-4 h-[14px] w-[14px] rounded-full border-2 border-background z-10",
          dotColor,
        )}
      />

      {/* card */}
      <div
        className={cn(
          "rounded-xl border p-4 transition-all duration-300 cursor-pointer select-none",
          cardBorder,
        )}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">{slot.label || slot.time}</p>
              <p className="text-xs text-muted-foreground">
                {WINDOW_LABELS[slot.time] ?? slot.time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "taken" && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckmarkAnimated />
                Taken
              </span>
            )}
            {status === "missed" && (
              <span className="text-xs font-medium text-destructive">Missed</span>
            )}
            {status === "current" && !slot.taken && (
              <span className="text-xs font-medium text-primary animate-pulse">Due now</span>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* expandable detail */}
        <div
          className={cn(
            "grid transition-all duration-300",
            expanded ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden space-y-2">
            {slot.medications.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No medications scheduled for this slot.
              </p>
            ) : (
              slot.medications.map((med, j) => (
                <div
                  key={j}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <Pill
                    className="h-5 w-5 shrink-0"
                    style={{ color: med.color || "#6366f1" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{med.name}</p>
                    {med.dosage && (
                      <p className="text-xs text-muted-foreground">{med.dosage}</p>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* take action button */}
            {!slot.taken && status !== "missed" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkTaken(slot.time);
                }}
                disabled={loading}
                className={cn(
                  "mt-2 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all",
                  "bg-gradient-to-r from-emerald-600 to-green-500 text-white",
                  "hover:from-emerald-500 hover:to-green-400 active:scale-[0.98]",
                  "disabled:opacity-50 disabled:pointer-events-none",
                )}
              >
                <Check className="h-4 w-4" />
                {loading ? "Logging…" : "Mark as Taken"}
              </button>
            )}

            {slot.taken && slot.taken_at && (
              <p className="text-[11px] text-muted-foreground mt-1">
                Completed at {new Date(slot.taken_at).toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── animated checkmark ── */

function CheckmarkAnimated() {
  return (
    <span className="relative flex h-5 w-5 items-center justify-center">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-30" />
      <Check className="h-3.5 w-3.5 text-emerald-600" />
    </span>
  );
}
