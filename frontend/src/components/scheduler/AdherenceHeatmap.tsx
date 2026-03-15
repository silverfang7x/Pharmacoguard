import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

/* ────────────────────── types ────────────────────── */

export interface HeatmapDay {
  date: string;
  adherence: number; // 0-100
  total_slots: number;
  taken_slots: number;
}

interface AdherenceHeatmapProps {
  year: number;
  month: number;        // 1-12
  days: HeatmapDay[];
  onMonthChange: (year: number, month: number) => void;
  loading?: boolean;
}

/* ─────────────── colour mapping ─────────────── */

function adherenceColor(pct: number | null): string {
  if (pct === null) return "bg-muted/40";
  if (pct >= 100) return "bg-emerald-600";
  if (pct >= 75)  return "bg-emerald-500/80";
  if (pct >= 50)  return "bg-yellow-500";
  return "bg-red-500";
}

function adherenceLabel(pct: number | null): string {
  if (pct === null) return "No data";
  if (pct >= 100) return "Perfect";
  if (pct >= 75)  return "Good";
  if (pct >= 50)  return "Partial";
  return "Missed";
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAY_HEADERS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

/* ─────────────────── component ──────────────────── */

export default function AdherenceHeatmap({
  year,
  month,
  days,
  onMonthChange,
  loading,
}: AdherenceHeatmapProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);

  /* ── build the calendar grid ── */
  const grid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    // Monday = 0 offset
    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const dayMap = new Map(days.map((d) => [d.date, d]));

    const cells: (HeatmapDay | null)[] = [];
    // leading blanks
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push(dayMap.get(dateStr) ?? { date: dateStr, adherence: -1, total_slots: 0, taken_slots: 0 });
    }
    return cells;
  }, [year, month, days]);

  const prevMonth = () => {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    onMonthChange(y, m);
  };

  const nextMonth = () => {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    onMonthChange(y, m);
  };

  return (
    <div className="space-y-4">
      {/* ── Month nav ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 gap-1.5 text-center">
        {DAY_HEADERS.map((d) => (
          <span key={d} className="text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </span>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className={cn("grid grid-cols-7 gap-1.5", loading && "opacity-50 pointer-events-none")}>
        {grid.map((cell, i) => {
          if (!cell) {
            return <div key={`blank-${i}`} className="aspect-square" />;
          }
          const dayNum = parseInt(cell.date.split("-")[2]!, 10);
          const pct = cell.adherence < 0 ? null : cell.adherence;
          const color = adherenceColor(pct);

          return (
            <button
              key={cell.date}
              onClick={() => setSelectedDay(cell)}
              className={cn(
                "relative aspect-square rounded-md flex flex-col items-center justify-center",
                "transition-all duration-200 hover:scale-110 hover:ring-2 hover:ring-ring/50",
                color,
              )}
              title={`${cell.date}: ${pct !== null ? `${pct}%` : "No data"}`}
            >
              <span className="text-[11px] font-medium leading-none text-white mix-blend-difference">
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground pt-2">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-muted/40" /> No data</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-red-500" /> &lt;50%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-yellow-500" /> 50-75%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-500/80" /> &gt;75%</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded-sm bg-emerald-600" /> 100%</span>
      </div>

      {/* ── Day detail popup ── */}
      {selectedDay && (
        <DayDetailPopup day={selectedDay} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}

/* ────────── day detail overlay ────────── */

function DayDetailPopup({
  day,
  onClose,
}: {
  day: HeatmapDay;
  onClose: () => void;
}) {
  const pct = day.adherence < 0 ? null : day.adherence;
  const status = adherenceLabel(pct);
  const color = adherenceColor(pct);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xs rounded-2xl border bg-card p-5 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="text-sm font-medium text-muted-foreground">{day.date}</p>

        <div className="mt-3 flex items-center gap-3">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg", color)}>
            {pct !== null ? `${Math.round(pct)}%` : "—"}
          </div>
          <div>
            <p className="font-semibold">{status}</p>
            <p className="text-sm text-muted-foreground">
              {day.taken_slots} of {day.total_slots} slots completed
            </p>
          </div>
        </div>

        {/* mini progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", color)}
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
      </div>
    </div>
  );
}
