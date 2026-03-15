import { cn } from "@/lib/utils";

interface Props {
  weeklyProgress: boolean[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyProgressRing({ weeklyProgress }: Props) {
  const completed = weeklyProgress.filter(Boolean).length;
  const total = 7;
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (completed / total) * circumference;

  return (
    <div className="rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <h3 className="text-sm font-bold text-foreground mb-4">Weekly Progress</h3>

      <div className="flex items-center gap-6">
        {/* Ring chart */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              opacity={0.4}
            />
            {/* Progress ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#weeklyGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="weeklyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-foreground">{completed}</span>
            <span className="text-[10px] text-muted-foreground font-medium">of {total}</span>
          </div>
        </div>

        {/* Day dots */}
        <div className="flex-1 grid grid-cols-1 gap-1.5">
          {weeklyProgress.map((done, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center transition-all",
                  done
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shadow-emerald-300/50"
                    : "bg-muted/60 border border-muted-foreground/20",
                )}
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium",
                done ? "text-emerald-700" : "text-muted-foreground",
              )}>
                {DAY_LABELS[i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
