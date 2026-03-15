import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import StreakCounter from "@/components/gamification/StreakCounter";
import WeeklyProgressRing from "@/components/gamification/WeeklyProgressRing";
import BadgeShowcase from "@/components/gamification/BadgeShowcase";
import RefillCountdown from "@/components/gamification/RefillCountdown";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";

interface Badge {
  name: string;
  tier: string;
  icon: string;
  description: string;
  earned_at?: string | null;
}

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_perfect_days: number;
  badges_earned: Badge[];
  next_milestone: number;
  weekly_progress: boolean[];
}

interface Prediction {
  drug_name: string;
  estimated_empty_date: string;
  confidence_score: number;
  days_remaining: number;
  should_alert: boolean;
}

const DEMO_STREAK: StreakData = {
  current_streak: 12,
  longest_streak: 18,
  total_perfect_days: 42,
  badges_earned: [
    { name: "First Steps", tier: "bronze", icon: "🔥", description: "3-day streak", earned_at: "2025-01-10" },
    { name: "Week Warrior", tier: "silver", icon: "⚡", description: "7-day streak", earned_at: "2025-01-15" },
  ],
  next_milestone: 14,
  weekly_progress: [true, true, true, false, true, true, true],
};

const DEMO_PREDICTIONS: Prediction[] = [
  { drug_name: "Metformin 500mg", estimated_empty_date: "2025-07-12", confidence_score: 0.87, days_remaining: 9, should_alert: false },
  { drug_name: "Lisinopril 10mg", estimated_empty_date: "2025-07-06", confidence_score: 0.92, days_remaining: 3, should_alert: true },
  { drug_name: "Sertraline 50mg", estimated_empty_date: "2025-07-08", confidence_score: 0.78, days_remaining: 5, should_alert: true },
];

export default function GamificationPage() {
  const session = useAuthStore((s) => s.session);
  const [streak, setStreak] = useState<StreakData>(DEMO_STREAK);
  const [predictions, setPredictions] = useState<Prediction[]>(DEMO_PREDICTIONS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    const pid = session.user.id;

    setLoading(true);
    Promise.allSettled([
      api.get(`/api/v1/gamification/streak/${pid}`).then((r) => r.data),
      api.get(`/api/v1/refill/predictions/${pid}`).then((r) => r.data),
    ]).then(([streakRes, refillRes]) => {
      if (streakRes.status === "fulfilled") setStreak(streakRes.value);
      if (refillRes.status === "fulfilled") setPredictions(refillRes.value.predictions ?? []);
      setLoading(false);
    });
  }, [session?.user?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <MeshBackground theme="gamification" />
      <PageHeader
        accent="orange"
        emoji="🎮"
        title="Health Streaks"
        subtitle="Stay consistent, earn rewards, and secure your health journey"
        rightContent={
          <div className="px-3 py-1.5 rounded-xl bg-orange-50 text-orange-700 text-sm font-semibold border border-orange-100 flex items-center gap-1.5">
            🔥 {streak.current_streak} Day Streak
          </div>
        }
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StreakCounter
          currentStreak={streak.current_streak}
          longestStreak={streak.longest_streak}
          nextMilestone={streak.next_milestone}
        />
        <WeeklyProgressRing weeklyProgress={streak.weekly_progress} />
        <BadgeShowcase
          badges={streak.badges_earned}
          totalPerfectDays={streak.total_perfect_days}
        />
        <RefillCountdown predictions={predictions} loading={loading} />
      </div>
    </div>
  );
}
