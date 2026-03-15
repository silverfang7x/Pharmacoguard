import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface Badge {
  name: string;
  tier: string;
  icon: string;
  description: string;
  earned_at?: string | null;
}

interface Props {
  badges: Badge[];
  totalPerfectDays: number;
}

const TIER_STYLES = {
  bronze: {
    bg: "bg-gradient-to-br from-amber-600 to-yellow-700",
    ring: "ring-amber-400/50",
    glow: "shadow-amber-400/30",
    label: "text-amber-700",
    labelBg: "bg-amber-100",
  },
  silver: {
    bg: "bg-gradient-to-br from-gray-300 to-slate-400",
    ring: "ring-slate-300/50",
    glow: "shadow-slate-400/30",
    label: "text-slate-600",
    labelBg: "bg-slate-100",
  },
  gold: {
    bg: "bg-gradient-to-br from-yellow-400 to-amber-500",
    ring: "ring-yellow-400/50",
    glow: "shadow-yellow-400/40",
    label: "text-yellow-700",
    labelBg: "bg-yellow-100",
  },
} as const;

type TierKey = keyof typeof TIER_STYLES;

function getTierStyles(tier: string) {
  return TIER_STYLES[tier as TierKey] ?? TIER_STYLES.bronze;
}

export default function BadgeShowcase({ badges, totalPerfectDays }: Props) {
  return (
    <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50 to-purple-50/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-500" />
          Badge Collection
        </h3>
        <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">
          {totalPerfectDays} perfect days
        </span>
      </div>

      {badges.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 opacity-30">🛡️</div>
          <p className="text-xs text-muted-foreground">
            Complete 3 consecutive perfect days to earn your first badge!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => {
            const style = getTierStyles(badge.tier);
            return (
              <div
                key={badge.name}
                className="flex flex-col items-center text-center group"
              >
                {/* Shield icon */}
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center",
                    "ring-2 shadow-lg transition-transform group-hover:scale-110",
                    style.bg, style.ring, style.glow,
                  )}
                >
                  <span className="text-2xl">{badge.icon}</span>
                </div>
                {/* Label */}
                <span className="text-[10px] font-bold mt-1.5 text-foreground leading-tight">
                  {badge.name}
                </span>
                <span
                  className={cn(
                    "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full mt-0.5",
                    style.labelBg, style.label,
                  )}
                >
                  {badge.tier}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
