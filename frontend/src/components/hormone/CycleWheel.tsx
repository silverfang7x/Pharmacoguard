import { useMemo } from "react";
import { cn } from "@/lib/utils";

/* ── Phase definitions ── */
const PHASES = [
  { key: "menstrual",  label: "Menstrual",  dayRange: "1–5",   color: "from-rose-400 to-red-500",   ring: "stroke-rose-400",  fill: "fill-rose-400/20" },
  { key: "follicular", label: "Follicular", dayRange: "6–13",  color: "from-pink-300 to-fuchsia-400", ring: "stroke-pink-400",  fill: "fill-pink-300/20" },
  { key: "ovulatory",  label: "Ovulatory",  dayRange: "14–16", color: "from-violet-400 to-purple-500", ring: "stroke-violet-400", fill: "fill-violet-400/20" },
  { key: "luteal",     label: "Luteal",     dayRange: "17–28", color: "from-purple-300 to-indigo-400", ring: "stroke-purple-400", fill: "fill-purple-300/20" },
] as const;

type Phase = (typeof PHASES)[number]["key"];

interface Props {
  currentPhase: Phase;
  cycleDay: number;
}

export default function CycleWheel({ currentPhase, cycleDay }: Props) {
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 120;
  const innerR = 70;
  const gapDeg = 3;

  /* Arc segments — one per phase */
  const segments = useMemo(() => {
    const phaseDays = [5, 8, 3, 12]; // menstrual, follicular, ovulatory, luteal
    const total = phaseDays.reduce((a, b) => a + b, 0);
    let startAngle = -90; // top of circle

    return PHASES.map((p, i) => {
      const days = phaseDays[i] ?? 0;
      const sweep = (days / total) * 360 - gapDeg;
      const seg = { ...p, startAngle, sweep };
      startAngle += sweep + gapDeg;
      return seg;
    });
  }, []);

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const donutPath = (start: number, sweep: number) => {
    const s = toRad(start);
    const e = toRad(start + sweep);
    const ox1 = cx + outerR * Math.cos(s);
    const oy1 = cy + outerR * Math.sin(s);
    const ox2 = cx + outerR * Math.cos(e);
    const oy2 = cy + outerR * Math.sin(e);
    const ix2 = cx + innerR * Math.cos(e);
    const iy2 = cy + innerR * Math.sin(e);
    const ix1 = cx + innerR * Math.cos(s);
    const iy1 = cy + innerR * Math.sin(s);
    const large = sweep > 180 ? 1 : 0;
    return [
      `M ${ox1} ${oy1}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");
  };

  /* Label position — midpoint of the arc at mid-radius */
  const labelPos = (start: number, sweep: number) => {
    const mid = toRad(start + sweep / 2);
    const r = (outerR + innerR) / 2;
    return { x: cx + r * Math.cos(mid), y: cy + r * Math.sin(mid) };
  };

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          {PHASES.map((p) => (
            <linearGradient key={p.key} id={`grad-${p.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {/* Parse color classes to actual hex — using tailwind palette */}
            </linearGradient>
          ))}
        </defs>

        {segments.map((seg) => {
          const isActive = seg.key === currentPhase;
          return (
            <g key={seg.key}>
              {/* Donut segment */}
              <path
                d={donutPath(seg.startAngle, seg.sweep)}
                className={cn(
                  "transition-all duration-500",
                  isActive ? "opacity-100" : "opacity-40 hover:opacity-60",
                )}
                fill={
                  isActive
                    ? `url(#active-${seg.key})`
                    : "hsl(var(--muted))"
                }
                stroke="white"
                strokeWidth={1}
              />

              {/* Active gradient overlay */}
              {isActive && (
                <>
                  <defs>
                    <linearGradient id={`active-${seg.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={seg.key === "menstrual" ? "#fb7185" : seg.key === "follicular" ? "#f9a8d4" : seg.key === "ovulatory" ? "#a78bfa" : "#c084fc"} />
                      <stop offset="100%" stopColor={seg.key === "menstrual" ? "#ef4444" : seg.key === "follicular" ? "#e879f9" : seg.key === "ovulatory" ? "#7c3aed" : "#818cf8"} />
                    </linearGradient>
                  </defs>
                  {/* Pulsing glow */}
                  <path
                    d={donutPath(seg.startAngle, seg.sweep)}
                    fill="none"
                    stroke={seg.key === "menstrual" ? "#fb7185" : seg.key === "follicular" ? "#f9a8d4" : seg.key === "ovulatory" ? "#a78bfa" : "#c084fc"}
                    strokeWidth={3}
                    className="animate-pulse"
                    opacity={0.6}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Phase labels around the wheel */}
        {segments.map((seg) => {
          const pos = labelPos(seg.startAngle, seg.sweep);
          const isActive = seg.key === currentPhase;
          return (
            <text
              key={`label-${seg.key}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider pointer-events-none",
                isActive ? "fill-white" : "fill-muted-foreground/60",
              )}
            >
              {seg.label}
            </text>
          );
        })}

        {/* Centre circle */}
        <circle cx={cx} cy={cy} r={innerR - 6} fill="hsl(var(--card))" />
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="fill-foreground text-xs font-medium"
        >
          Day
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="fill-foreground text-3xl font-bold"
        >
          {cycleDay}
        </text>
        <text
          x={cx}
          y={cy + 30}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px] font-medium capitalize"
        >
          {currentPhase}
        </text>
      </svg>

      {/* Legend below */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-3">
        {PHASES.map((p) => (
          <div key={p.key} className="flex items-center gap-1">
            <span
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                p.key === currentPhase ? "ring-2 ring-offset-1 ring-purple-400" : "",
                p.key === "menstrual"  ? "bg-rose-400" :
                p.key === "follicular" ? "bg-pink-400" :
                p.key === "ovulatory"  ? "bg-violet-500" :
                "bg-purple-400",
              )}
            />
            <span className={cn(
              "text-[10px]",
              p.key === currentPhase ? "text-foreground font-semibold" : "text-muted-foreground",
            )}>
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
