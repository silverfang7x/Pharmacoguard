import { useState, useMemo } from "react";
import { Search, Filter, Pill } from "lucide-react";
import { cn } from "@/lib/utils";
import MedicationCard, { type MedicationCardData } from "@/components/knowledge/MedicationCard";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";

/* ── demo data (replace with API fetch in production) ── */
const DEMO_MEDICATIONS: MedicationCardData[] = [
  { id: "1", name: "Amoxicillin",    genericName: "Amoxicillin trihydrate", dosage: "500 mg · 3×/day",   category: "antibiotic",   prescribingDoctor: "Dr. Sarah Chen",     active: true },
  { id: "2", name: "Metformin",      genericName: "Metformin HCl",          dosage: "850 mg · 2×/day",   category: "antidiabetic", prescribingDoctor: "Dr. James Wilson",    active: true },
  { id: "3", name: "Lisinopril",     genericName: "Lisinopril dihydrate",   dosage: "10 mg · 1×/day",    category: "cardiac",      prescribingDoctor: "Dr. Aisha Patel",    active: true },
  { id: "4", name: "Ibuprofen",      genericName: "Ibuprofen",              dosage: "400 mg · as needed", category: "analgesic",    prescribingDoctor: "Dr. Sarah Chen",     active: true },
  { id: "5", name: "Sertraline",     genericName: "Sertraline HCl",         dosage: "50 mg · 1×/day",    category: "neurological", prescribingDoctor: "Dr. Emily Rogers",   active: true },
  { id: "6", name: "Albuterol",      genericName: "Salbutamol",             dosage: "90 mcg · as needed", category: "respiratory",  prescribingDoctor: "Dr. James Wilson",   active: true },
  { id: "7", name: "Levothyroxine",  genericName: "Levothyroxine sodium",   dosage: "75 mcg · 1×/day",   category: "hormonal",     prescribingDoctor: "Dr. Aisha Patel",    active: true },
  { id: "8", name: "Azithromycin",   genericName: "Azithromycin dihydrate", dosage: "250 mg · 1×/day",   category: "antibiotic",   prescribingDoctor: "Dr. Sarah Chen",     active: false },
  { id: "9", name: "Atorvastatin",   genericName: "Atorvastatin calcium",   dosage: "20 mg · 1×/day",    category: "cardiac",      prescribingDoctor: "Dr. Aisha Patel",    active: false },
  { id: "10", name: "Gabapentin",    genericName: "Gabapentin",             dosage: "300 mg · 3×/day",   category: "neurological", prescribingDoctor: "Dr. Emily Rogers",   active: false },
];

const ALL_CATEGORIES = [
  "all",
  "antibiotic",
  "cardiac",
  "analgesic",
  "antidiabetic",
  "neurological",
  "respiratory",
  "hormonal",
];

type Tab = "active" | "past";

export default function KnowledgeVaultPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = DEMO_MEDICATIONS.filter((m) =>
      tab === "active" ? m.active : !m.active,
    );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.genericName?.toLowerCase().includes(q) ||
          m.prescribingDoctor.toLowerCase().includes(q),
      );
    }

    if (category !== "all") {
      list = list.filter((m) => m.category === category);
    }

    return list;
  }, [tab, search, category]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <MeshBackground theme="druginfo" />
      <PageHeader
        accent="blue"
        emoji="📖"
        title="Drug Information"
        subtitle="AI-powered explanations in plain English"
        rightContent={
          <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-blue-100 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors">
            Search Shortcut ⌘K
          </button>
        }
      />

      {/* Active / Past toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setOpenCardId(null); }}
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize",
              tab === t
                ? "bg-white/70 backdrop-blur-sm shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "active" ? "Active Medications" : "Past Medications"}
          </button>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search medications, generics, or doctors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card text-sm",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "transition-all",
            )}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={cn(
              "pl-10 pr-8 py-2.5 rounded-xl border bg-card text-sm appearance-none cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
              "transition-all capitalize",
            )}
          >
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Categories" : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((med) => (
            <MedicationCard
              key={med.id}
              med={med}
              isOpen={openCardId === med.id}
              onToggle={() => setOpenCardId(openCardId === med.id ? null : med.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Pill className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">No medications found</p>
          <p className="text-xs mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

