import { useState } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  Droplets,
  Loader2,
  Check,
} from "lucide-react";

const PHASES = ["menstrual", "follicular", "ovulatory", "luteal"] as const;
type Phase = (typeof PHASES)[number];

const MOOD_OPTIONS = [
  { value: 2, emoji: "😫", label: "Low", color: "bg-rose-50 hover:bg-rose-100 text-rose-700 ring-rose-300" },
  { value: 5, emoji: "😐", label: "Okay", color: "bg-amber-50 hover:bg-amber-100 text-amber-700 ring-amber-300" },
  { value: 8, emoji: "😊", label: "Good", color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 ring-emerald-300" },
];

const ENERGY_OPTIONS = [
  { value: 2, emoji: "🪫", label: "Low", color: "bg-rose-50 hover:bg-rose-100 text-rose-700 ring-rose-300" },
  { value: 5, emoji: "🔋", label: "Okay", color: "bg-amber-50 hover:bg-amber-100 text-amber-700 ring-amber-300" },
  { value: 8, emoji: "⚡", label: "High", color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 ring-emerald-300" },
];

interface Props {
  currentPhase: Phase;
  cycleDay: number;
  onLogged?: () => void;
}

export default function DailyLogForm({ currentPhase, cycleDay, onLogged }: Props) {
  const [flow, setFlow] = useState(0);
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post("/hormone/log", {
        date: today,
        cycle_day: cycleDay,
        phase: currentPhase,
        flow_intensity: flow,
        mood_score: mood,
        energy_score: energy,
      });
      setSaved(true);
      onLogged?.();
      setTimeout(() => setSaved(false), 2500);
    } catch {
      /* silently fail */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-6 space-y-7 shadow-sm">
      <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
        <Droplets className="w-5 h-5 text-pink-500" />
        Daily Cycle Log
      </h3>

      {/* Flow intensity slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Flow Intensity
          </label>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 text-center text-xs font-bold text-gray-500">{flow === 0 ? "None" : flow}</div>
          <div className="relative flex-1 flex items-center h-8">
            <input
              type="range"
              min={0}
              max={5}
              step={1}
              value={flow}
              onChange={(e) => setFlow(Number(e.target.value))}
              className="absolute w-full h-3 rounded-full appearance-none cursor-pointer z-10 bg-transparent
                [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-pink-500
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-md"
            />
            {/* Custom Track Background */}
            <div className="absolute left-0 right-0 h-3 rounded-full bg-gray-100 overflow-hidden">
               <div
                 className="h-full bg-gradient-to-r from-pink-200 to-rose-500 transition-all duration-200"
                 style={{ width: `${(flow / 5) * 100}%` }}
               />
            </div>
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase px-14">
          <span>None</span>
          <span>Light</span>
          <span>Moderate</span>
          <span>Heavy</span>
        </div>
      </div>

      {/* Mood picker */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Mood</label>
        <div className="grid grid-cols-3 gap-3">
          {MOOD_OPTIONS.map((opt) => {
            const active = mood === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setMood(opt.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border-2",
                  active
                    ? `border-transparent ring-2 ring-offset-2 scale-105 shadow-md ${opt.color}`
                    : "border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 text-gray-500"
                )}
              >
                <div className="text-3xl filter drop-shadow-sm">{opt.emoji}</div>
                <span className="text-xs font-bold">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Energy picker */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Energy Level</label>
        <div className="grid grid-cols-3 gap-3">
          {ENERGY_OPTIONS.map((opt) => {
            const active = energy === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setEnergy(opt.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all border-2",
                  active
                    ? `border-transparent ring-2 ring-offset-2 scale-105 shadow-md ${opt.color}`
                    : "border-gray-100 bg-gray-50 hover:bg-gray-100 hover:border-gray-200 text-gray-500"
                )}
              >
                <div className="text-3xl filter drop-shadow-sm">{opt.emoji}</div>
                <span className="text-xs font-bold">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={saving || mood === null}
        className={cn(
          "w-full py-2.5 rounded-xl text-sm font-semibold transition-all",
          "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white",
          "hover:shadow-lg hover:shadow-purple-300/40 active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          saved && "!from-emerald-500 !to-green-500",
        )}
      >
        {saving ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving…
          </span>
        ) : saved ? (
          <span className="flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> Logged!
          </span>
        ) : (
          "Log Today"
        )}
      </button>
    </div>
  );
}
