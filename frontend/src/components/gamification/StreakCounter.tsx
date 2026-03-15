import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface Props {
  currentStreak: number;
  longestStreak: number;
  nextMilestone: number;
}

export default function StreakCounter({ currentStreak, longestStreak, nextMilestone }: Props) {
  const progress = nextMilestone > 0 ? Math.min((currentStreak / nextMilestone) * 100, 100) : 0;

  return (
    <div className="relative rounded-2xl border border-orange-200/60 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6 overflow-hidden">
      {/* Decorative background flames */}
      <div className="absolute -top-4 -right-4 opacity-[0.07]">
        <Flame className="w-32 h-32 text-orange-500" />
      </div>

      {/* Streak number */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center",
            "bg-gradient-to-br from-orange-400 to-red-500",
            "shadow-lg shadow-orange-300/40",
            currentStreak > 0 && "animate-pulse",
          )}>
            <span className="text-3xl font-black text-white">{currentStreak}</span>
          </div>
          {/* Fire emoji */}
          {currentStreak > 0 && (
            <span className="absolute -top-3 -right-3 text-2xl animate-bounce">🔥</span>
          )}
        </div>

        <div>
          <p className="text-lg font-bold text-foreground">
            Day Streak
          </p>
          <p className="text-xs text-muted-foreground">
            Longest: <span className="font-semibold text-orange-600">{longestStreak} days</span>
          </p>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted-foreground">Next milestone</span>
          <span className="font-bold text-orange-600">
            {currentStreak}/{nextMilestone} days
          </span>
        </div>
        <div className="h-3 rounded-full bg-orange-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {nextMilestone - currentStreak} more day{nextMilestone - currentStreak !== 1 ? "s" : ""} to unlock next badge!
        </p>
      </div>
    </div>
  );
}
