import { useState, useEffect } from "react";
import CycleWheel from "@/components/hormone/CycleWheel";
import DailyLogForm from "@/components/hormone/DailyLogForm";
import { DrugWarningsPanel, ForecastCard } from "@/components/hormone/DrugWarningsForecast";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";
import { api } from "@/lib/api";
import { Loader2, CalendarHeart, Calendar, Activity, TrendingUp } from "lucide-react";

/* ── Demo state (replace with API-driven state) ── */
const DEMO_DRUG_IDS = [
  "00000000-0000-0000-0000-000000000001",
  "00000000-0000-0000-0000-000000000002",
];
const DEMO_DRUG_NAMES = "Ibuprofen,Sertraline";

type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export default function HormoneSyncPage() {
  const [cycleDay, setCycleDay] = useState(14);
  const [phase, setPhase] = useState<Phase>("ovulatory");
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasEntries, setHasEntries] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [lastPeriod, setLastPeriod] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  // Check if they have any logs
  useEffect(() => {
    api.get<{ count: number }>("/hormone/log/count")
      .then((res) => setHasEntries(res.data.count > 0))
      .catch(() => setHasEntries(false)); // default to onboarding if backend is missing
  }, []);

  useEffect(() => {
    if (hasEntries === false) {
      setShowOnboarding(true);
    }
  }, [hasEntries]);

  const handleLogged = () => {
    setRefreshKey((k) => k + 1);
    setHasEntries(true);
    setShowOnboarding(false);
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingLoading(true);
    try {
      // In a real app we'd save settings to profile and create first log.
      // For demo, we just dismiss it.
      await new Promise(r => setTimeout(r, 800));
      setShowOnboarding(false);
      setHasEntries(true);
    } finally {
      setOnboardingLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      <MeshBackground theme="hormone" />
      <PageHeader
        accent="pink"
        emoji="🌸"
        title="Hormone Sync"
        subtitle="Cycle & medication correlation tracker"
        rightContent={
          <div className="px-3 py-1.5 rounded-xl bg-pink-50 text-pink-700 text-sm font-semibold border border-pink-100 capitalize shadow-sm">
            {phase} Phase
          </div>
        }
      />

      {/* Onboarding Banner */}
      {showOnboarding && (
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🌸</div>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Welcome to Hormone Sync</h2>
                <p className="text-sm text-gray-600 mt-1">Start by telling us about your cycle so we can calibrate your predictions.</p>
              </div>
              <form onSubmit={handleOnboardingSubmit} className="flex flex-wrap items-end gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Last period start date</label>
                  <input
                    type="date"
                    required
                    value={lastPeriod}
                    onChange={(e) => setLastPeriod(e.target.value)}
                    className="block w-[180px] bg-white border border-pink-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pink-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">Average cycle length</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={21}
                      max={45}
                      value={cycleLength}
                      onChange={(e) => setCycleLength(Number(e.target.value))}
                      className="block w-[120px] bg-white border border-pink-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-pink-400 focus:outline-none pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">days</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={onboardingLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl px-6 py-2 text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {onboardingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarHeart className="w-4 h-4" />}
                  Start Tracking
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Main grid: wheel + log | warnings + forecast */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-500 ${showOnboarding ? "opacity-40 pointer-events-none grayscale-[0.5]" : ""}`}>
        {/* ── Left column: Wheel + Daily Log ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Phase wheel card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col items-center">
            
            <div className="flex flex-col md:flex-row items-center gap-12 w-full max-w-2xl justify-center">
              {/* The SVG Wheel */}
              <div className="shrink-0 relative z-10 mb-8 md:mb-0">
                <CycleWheel currentPhase={phase} cycleDay={cycleDay} />
              </div>

              {/* Context info for current phase */}
              <div className="flex-1 space-y-4 w-full md:w-auto">
                <div>
                  <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-purple-600 mb-2">
                    {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase
                  </h3>
                  <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-700">Days 14–16</span>
                  </div>
                </div>
                <div className="space-y-3 mt-4">
                  <div className="rounded-xl p-4 border-l-4 border-violet-500 shadow-sm bg-violet-50/50">
                    <div className="flex gap-3">
                      <Activity className="w-5 h-5 text-violet-600 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">Hormone Status</p>
                        <p className="text-sm text-gray-600 leading-relaxed">Estrogen dropping abruptly, Progesterone rising. Core temp increases.</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl p-4 border-l-4 border-indigo-500 shadow-sm bg-indigo-50/50">
                    <div className="flex gap-3">
                      <TrendingUp className="w-5 h-5 text-indigo-600 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-1">Metabolism Shift</p>
                        <p className="text-sm text-gray-600 leading-relaxed">Clearance rate of some hepatically metabolized drugs may increase by up to 15%.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase info strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              [
                { key: "menstrual",  label: "Menstrual",  days: "1–5",   emoji: "🩸", desc: "Shedding phase", color: "#fb7185" },
                { key: "follicular", label: "Follicular", days: "6–13",  emoji: "🌱", desc: "Estrogen rising", color: "#f472b6" },
                { key: "ovulatory",  label: "Ovulatory",  days: "14–16", emoji: "✨", desc: "Peak fertility", color: "#a855f7" },
                { key: "luteal",     label: "Luteal",     days: "17–28", emoji: "🌙", desc: "Progesterone peak", color: "#c084fc" },
              ] as const
            ).map((p) => {
              const isActive = phase === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setPhase(p.key as Phase);
                    const dayMap = { menstrual: 3, follicular: 9, ovulatory: 14, luteal: 22 };
                    setCycleDay(dayMap[p.key as Phase]);
                  }}
                  className={`relative rounded-xl border p-4 text-left transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "bg-white border-pink-200 shadow-md shadow-pink-100 scale-[1.02]"
                      : "bg-white/60 border-transparent hover:bg-white hover:border-gray-100"
                  }`}
                >
                  <div
                    className="absolute top-0 right-0 w-16 h-16 rounded-bl-[100px] opacity-10 transition-colors"
                    style={{ backgroundColor: isActive ? p.color : "transparent" }}
                  />
                  <div className="relative z-10">
                    <div className="text-2xl mb-2">{p.emoji}</div>
                    <div className="text-sm font-bold text-gray-900">{p.label}</div>
                    <div className="text-xs font-semibold text-gray-600 mt-0.5">{p.days} Days</div>
                    <div className="text-[11px] text-gray-500 mt-1 leading-snug">{p.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Daily log form */}
          <DailyLogForm
            currentPhase={phase}
            cycleDay={cycleDay}
            onLogged={handleLogged}
          />
        </div>

        {/* ── Right column: Warnings + Forecast ── */}
        <div className="space-y-6" key={refreshKey}>
          <DrugWarningsPanel drugIds={DEMO_DRUG_IDS} />
          <ForecastCard drugs={DEMO_DRUG_NAMES} />
        </div>
      </div>
    </div>
  );
}
