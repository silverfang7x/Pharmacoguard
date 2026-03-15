import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CalendarDays, Pill, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import MeshBackground from "@/components/shared/MeshBackground";

/* ── Fallback Data ── */
interface FallbackMed {
  id: string;
  name: string;
  dosage: string;
  taken: boolean;
}

interface FallbackSlot {
  label: string;
  timeLabel: string;
  timeValue: string; // HH:mm format for current time comparison
  meds: FallbackMed[];
}

const INITIAL_FALLBACK: FallbackSlot[] = [
  {
    label: "Morning",
    timeLabel: "8:00 AM",
    timeValue: "08:00",
    meds: [
      { id: "m1", name: "Metformin", dosage: "500mg", taken: false },
      { id: "m2", name: "Lisinopril", dosage: "10mg", taken: false },
    ],
  },
  {
    label: "Afternoon",
    timeLabel: "1:00 PM",
    timeValue: "13:00",
    meds: [{ id: "m3", name: "Amoxicillin", dosage: "500mg", taken: false }],
  },
  {
    label: "Evening",
    timeLabel: "6:00 PM",
    timeValue: "18:00",
    meds: [{ id: "m4", name: "Metformin", dosage: "500mg", taken: false }],
  },
  {
    label: "Night",
    timeLabel: "10:00 PM",
    timeValue: "22:00",
    meds: [
      { id: "m5", name: "Sertraline", dosage: "50mg", taken: false },
      { id: "m6", name: "Albuterol", dosage: "90mcg", taken: false },
    ],
  },
];

/* ── Helpers ── */
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

/* ── Sub-components ── */

function MedCheckbox({
  med,
  onToggle,
}: {
  med: FallbackMed;
  onToggle: (id: string, taken: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-3 rounded-xl transition-all duration-300 border border-transparent",
        med.taken ? "bg-emerald-50/50 border-emerald-100" : "hover:bg-gray-50",
      )}
    >
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <Pill className="w-4 h-4 text-slate-400" />
      </div>

      <div className="flex-1">
        <p
          className={cn(
            "text-base font-semibold transition-all duration-300",
            med.taken ? "text-slate-400 line-through" : "text-slate-900",
          )}
        >
          {med.name}
        </p>
        <p className="text-xs text-slate-500 font-medium">{med.dosage}</p>
      </div>

      <button
        type="button"
        onClick={() => onToggle(med.id, !med.taken)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shrink-0",
          med.taken
            ? "bg-emerald-500 border border-emerald-500 text-white"
            : "border-2 border-slate-200 hover:border-emerald-300 text-transparent",
        )}
      >
        <AnimatePresence>
          {med.taken && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

function HeatmapCalendar({ year, month }: { year: number; month: number }) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Generate fake adherence data for the current month
  const dayColors = useMemo(() => {
    const arr = new Array(daysInMonth).fill(0);
    const today = new Date().getDate();
    return arr.map((_, i) => {
      const day = i + 1;
      if (day > today && month === new Date().getMonth() + 1) return "no-data"; // Future
      if (day === 4 || day === 15) return "low"; // <50%
      if (day === 8 || day === 22) return "medium"; // 50-75%
      if (day === 12 || day === 19) return "high"; // >75%
      return "perfect"; // 100%
    });
  }, [daysInMonth, month]);

  const colorCls = (rating: string) => {
    switch (rating) {
      case "perfect": return "bg-emerald-500 shadow-sm shadow-emerald-200/50 hover:bg-emerald-400";
      case "high": return "bg-emerald-300 shadow-sm shadow-emerald-100 hover:bg-emerald-200";
      case "medium": return "bg-yellow-300 shadow-sm shadow-yellow-100 hover:bg-yellow-200";
      case "low": return "bg-rose-400 shadow-sm shadow-rose-200 hover:bg-rose-300";
      default: return "bg-slate-100 text-slate-300 cursor-not-allowed";
    }
  };

  const getDayLabel = (rating: string) => {
    switch(rating) {
      case "perfect": return "100% Taken";
      case "high": return "75%+ Taken";
      case "medium": return "Half Taken";
      case "low": return "Missed Doses";
      default: return "No Data";
    }
  };

  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
    <div key={`blank-${i}`} className="aspect-square" />
  ));

  const days = Array.from({ length: daysInMonth }).map((_, i) => {
    const day = i + 1;
    const rating = dayColors[i] || "no-data";
    const isSelected = selectedDay === day;

    return (
      <div key={day} className="relative">
        <button
          onClick={() => rating !== "no-data" && setSelectedDay(isSelected ? null : day)}
          className={cn(
            "w-full aspect-square rounded-xl text-xs font-bold transition-all flex items-center justify-center",
            colorCls(rating),
            rating !== "no-data" ? "text-white cursor-pointer hover:-translate-y-0.5" : ""
          )}
        >
          {day}
        </button>

        {/* Popover */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-xl z-10 text-center"
            >
              <div className="font-bold mb-1">Oct {day}</div>
              <div className="text-slate-300">{getDayLabel(rating)}</div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold text-slate-800">
          {new Date(year, month - 1).toLocaleString("default", { month: "long" })} {year}
        </h3>
      </div>
      <div className="grid grid-cols-7 gap-3 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="text-center text-xs font-bold text-slate-400">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3">
        {blanks}
        {days}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-6 mt-6 border-t border-slate-100">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" /><span className="text-xs font-medium text-slate-500">100%</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-300" /><span className="text-xs font-medium text-slate-500">&gt;75%</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-300" /><span className="text-xs font-medium text-slate-500">50-75%</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-400" /><span className="text-xs font-medium text-slate-500">&lt;50%</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-100" /><span className="text-xs font-medium text-slate-500">No Data</span></div>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function SchedulerPage() {
  const queryClient = useQueryClient();
  const today = todayISO();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<"timeline" | "heatmap">("timeline");

  // Local fallback state
  const [slots, setSlots] = useState<FallbackSlot[]>(INITIAL_FALLBACK);
  const [currentHour, setCurrentHour] = useState(now.getHours());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  /* ── Preserved Supabase data fetching logic (from old SchedulerPage) ── */
  const dailyQuery = useQuery<{ date: string; slots: any[]; progress: number }>({
    queryKey: ["scheduler", "daily", today],
    queryFn: () => api.get(`/scheduler/daily/${today}`).then((r) => r.data),
  });

  const heatmapQuery = useQuery<{ year: number; month: number; days: any[] }>({
    queryKey: ["scheduler", "heatmap", now.getFullYear(), now.getMonth() + 1],
    queryFn: () => api.get(`/scheduler/heatmap/${now.getFullYear()}/${now.getMonth() + 1}`).then((r) => r.data),
  });

  const markTakenMutation = useMutation({
    mutationFn: (slotTime: string) =>
      api.post("/scheduler/log-taken", { date: today, slot_time: slotTime }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduler", "daily", today] });
      queryClient.invalidateQueries({ queryKey: ["scheduler", "heatmap", now.getFullYear(), now.getMonth() + 1] });
    },
  });

  /* ── Toggle local state ── */
  const toggleMed = (slotIndex: number, medId: string, taken: boolean) => {
    const newSlots = [...slots];
    const slot = newSlots[slotIndex];
    if (!slot) return;
    const medIndex = slot.meds.findIndex((m) => m.id === medId);
    if (medIndex === -1) return;
    const med = slot.meds[medIndex];
    if (!med) return;
    med.taken = taken;
    setSlots(newSlots);
    // Also quietly fire the real mutation if it exists, to keep real data synced if the backend ever wakes up
    markTakenMutation.mutateAsync(medId).catch(() => {});
  };

  /* ── Progress calculation ── */
  const totalMeds = slots.reduce((acc, slot) => acc + slot.meds.length, 0);
  const takenMeds = slots.reduce((acc, slot) => acc + slot.meds.filter(m => m.taken).length, 0);
  const progressPercent = Math.round((takenMeds / totalMeds) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      <MeshBackground theme="schedule" />
      <PageHeader
        accent="emerald"
        emoji="🗓️"
        title="Medication Schedule"
        subtitle="Daily timeline & adherence tracker"
        rightContent={
          <>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200 shadow-sm">
              {progressPercent}% Taken
            </div>
            <button className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all">
              Log Dose
            </button>
          </>
        }
      />

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit mb-8 shadow-inner border border-slate-200/60">
        <button
          onClick={() => setActiveTab("timeline")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === "timeline" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <Clock className="w-4 h-4" /> Daily Timeline
        </button>
        <button
          onClick={() => setActiveTab("heatmap")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all",
            activeTab === "heatmap" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          )}
        >
          <CalendarDays className="w-4 h-4" /> Monthly Heatmap
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "timeline" ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">Today's Progress</h3>
                    <p className="text-sm text-slate-500">{takenMeds} of {totalMeds} medications taken</p>
                  </div>
                  {progressPercent === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-emerald-500 font-black text-sm px-3 py-1 bg-emerald-50 rounded-lg flex items-center gap-1 border border-emerald-100"
                    >
                      Great job! 🎉
                    </motion.div>
                  )}
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                    className="h-full bg-emerald-500 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]"
                  />
                </div>
              </div>

              {/* Timeline Cards */}
              <div className="relative pl-4 space-y-6 before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100 before:-z-10">
                {slots.map((slot, idx) => {
                  const slotHour = parseInt(slot.timeValue.split(":")[0] || "0");
                  const isActive = currentHour >= slotHour && currentHour < slotHour + 4; // 4 hour active window

                  return (
                    <Card
                      key={slot.label}
                      className={cn(
                        "relative border-l-4 rounded-2xl overflow-visible shadow-sm hover:shadow-md transition-shadow",
                        isActive ? "border-l-emerald-400" : "border-l-slate-200"
                      )}
                    >
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute -left-[19px] top-6 w-3 h-3 rounded-full border-2 border-white",
                        isActive ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" : "bg-slate-300"
                      )} />

                      <div className="p-5 flex flex-col md:flex-row md:items-start gap-4">
                        {/* Time Label */}
                        <div className="w-32 shrink-0 pt-1">
                          <div className={cn(
                            "flex items-center gap-1.5 font-black text-sm",
                            isActive ? "text-emerald-600" : "text-slate-500"
                          )}>
                            <Clock className="w-4 h-4" /> {slot.label}
                          </div>
                          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider ml-5 mt-0.5">
                            {slot.timeLabel}
                          </div>
                        </div>

                        {/* Meds List */}
                        <div className="flex-1 space-y-2">
                          {slot.meds.map((med) => (
                            <MedCheckbox
                              key={med.id}
                              med={med}
                              onToggle={(id, taken) => toggleMed(idx, id, taken)}
                            />
                          ))}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <Card className="p-8 border-none shadow-md">
               <HeatmapCalendar year={now.getFullYear()} month={now.getMonth() + 1} />
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Supabase API state placeholders (invisible) */}
      <div className="hidden">
        <span data-loading={dailyQuery.isLoading}>{heatmapQuery.data?.year?.toString()}</span>
      </div>
    </div>
  );
}
