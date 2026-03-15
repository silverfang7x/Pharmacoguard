import { useState, useRef } from "react";
import {
  Pill,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Loader2,
  Stethoscope,
  UtensilsCrossed,
  AlertCircle,
  Heart,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

/* ── colour map by drug category ── */
const CATEGORY_COLORS = {
  antibiotic:   { bg: "bg-blue-50",    border: "border-blue-200",   icon: "text-blue-500",    badge: "bg-blue-100 text-blue-700" },
  cardiac:      { bg: "bg-red-50",     border: "border-red-200",    icon: "text-red-500",     badge: "bg-red-100 text-red-700" },
  analgesic:    { bg: "bg-amber-50",   border: "border-amber-200",  icon: "text-amber-500",   badge: "bg-amber-100 text-amber-700" },
  antidiabetic: { bg: "bg-violet-50",  border: "border-violet-200", icon: "text-violet-500",  badge: "bg-violet-100 text-violet-700" },
  neurological: { bg: "bg-pink-50",    border: "border-pink-200",   icon: "text-pink-500",    badge: "bg-pink-100 text-pink-700" },
  respiratory:  { bg: "bg-cyan-50",    border: "border-cyan-200",   icon: "text-cyan-500",    badge: "bg-cyan-100 text-cyan-700" },
  hormonal:     { bg: "bg-fuchsia-50", border: "border-fuchsia-200",icon: "text-fuchsia-500", badge: "bg-fuchsia-100 text-fuchsia-700" },
  default:      { bg: "bg-emerald-50", border: "border-emerald-200",icon: "text-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
} as const;

type ColorEntry = (typeof CATEGORY_COLORS)[keyof typeof CATEGORY_COLORS];

function getColors(category: string): ColorEntry {
  const key = category.toLowerCase() as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key] ?? CATEGORY_COLORS.default;
}

/* ── types ── */
export interface MedicationCardData {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  category: string;
  prescribingDoctor: string;
  active: boolean;
}

interface DrugInfo {
  plain_english_use: string;
  how_to_take: string;
  side_effects_simple: string;
  why_prescribed_for_patient: string;
  food_interactions: string;
  cycle_impact_warning: string;
}

interface Props {
  med: MedicationCardData;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function MedicationCard({ med, isOpen, onToggle }: Props) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = isOpen !== undefined ? isOpen : internalExpanded;
  const [info, setInfo] = useState<DrugInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const colors = getColors(med.category);

  /* ── expand & fetch AI info ── */
  const handleToggle = async () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
    const next = isOpen !== undefined ? !isOpen : !internalExpanded;
    if (next && !info && !loadingInfo) {
      setLoadingInfo(true);
      try {
        const { data } = await api.get<DrugInfo>(
          `/medications/${encodeURIComponent(med.name)}/info`,
        );
        setInfo(data);
      } catch {
        // Fallback: call Groq API directly
        try {
          const groqKey = import.meta.env.VITE_GROQ_API_KEY;
          if (groqKey) {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${groqKey}`,
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                  {
                    role: "user",
                    content: `Explain what ${med.name} is used for in 2 simple sentences a patient can understand. Then give one important tip about how to take it correctly.`,
                  },
                ],
                max_tokens: 200,
              }),
            });
            const json = await res.json();
            const text = json.choices?.[0]?.message?.content ?? "";
            setInfo({
              plain_english_use: text,
              how_to_take: "",
              side_effects_simple: "",
              why_prescribed_for_patient: "",
              food_interactions: "",
              cycle_impact_warning: "",
            });
          } else {
            throw new Error("No Groq key");
          }
        } catch {
          setInfo({
            plain_english_use: "Unable to load information. Please try again later.",
            how_to_take: "",
            side_effects_simple: "",
            why_prescribed_for_patient: "",
            food_interactions: "",
            cycle_impact_warning: "",
          });
        }
      } finally {
        setLoadingInfo(false);
      }
    }
  };

  /* ── audio playback ── */
  const handleAudio = async () => {
    if (playing && audioRef.current) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
      return;
    }

    setLoadingAudio(true);
    try {
      const { data } = await api.post<{ audio_url: string; transcript: string }>(
        "/medications/audio-explanation",
        { drug_name: med.name },
      );
      setAudioUrl(data.audio_url);
      const audio = new Audio(data.audio_url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    } catch {
      /* silently fail for audio */
    } finally {
      setLoadingAudio(false);
    }
  };

  const hasCycleWarning = info?.cycle_impact_warning && 
    info.cycle_impact_warning.toLowerCase() !== "no known cycle impact";

  return (
    <div
      className={cn(
        "group relative rounded-2xl border-2 transition-all duration-300",
        colors.border,
        colors.bg,
        expanded ? "shadow-xl scale-[1.01]" : "shadow-sm hover:shadow-md hover:-translate-y-0.5",
        !med.active && "opacity-60 grayscale-[30%]",
      )}
    >
      {/* Collapsed header */}
      <button
        onClick={handleToggle}
        className="w-full text-left p-5 flex items-start gap-4"
      >
        {/* Pill icon */}
        <div
          className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
            "bg-white/70 shadow-inner backdrop-blur-sm",
          )}
        >
          <Pill className={cn("w-6 h-6", colors.icon)} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-foreground text-base truncate">
              {med.name}
            </h3>
            <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", colors.badge)}>
              {med.category}
            </span>
            {!med.active && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
                Past
              </span>
            )}
          </div>
          {med.genericName && (
            <p className="text-xs text-muted-foreground mt-0.5">{med.genericName}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span className="font-medium">{med.dosage}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span className="flex items-center gap-1">
              <Stethoscope className="w-3 h-3" /> {med.prescribingDoctor}
            </span>
          </div>
        </div>

        {/* Expand chevron */}
        <div className="flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {loadingInfo ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading AI explanation…</span>
            </div>
          ) : info ? (
            <>
              {/* Plain english use */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> What This Drug Does
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {info.plain_english_use}
                </p>
              </section>

              {/* Why prescribed */}
              {info.why_prescribed_for_patient && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" /> Why It's Prescribed
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {info.why_prescribed_for_patient}
                  </p>
                </section>
              )}

              {/* Food interactions */}
              {info.food_interactions && (
                <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-700 mb-1 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5" /> Food Warnings
                  </h4>
                  <p className="text-sm text-yellow-900 leading-relaxed">
                    {info.food_interactions}
                  </p>
                </section>
              )}

              {/* Cycle impact badge */}
              {hasCycleWarning && (
                <div className="flex items-start gap-2 bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-fuchsia-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-fuchsia-700 mb-0.5">
                      Cycle Impact Warning
                    </h4>
                    <p className="text-sm text-fuchsia-900 leading-relaxed">
                      {info.cycle_impact_warning}
                    </p>
                  </div>
                </div>
              )}

              {/* Side effects */}
              {info.side_effects_simple && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Common Side Effects
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {info.side_effects_simple}
                  </p>
                </section>
              )}

              {/* Audio button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAudio();
                }}
                disabled={loadingAudio}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  "bg-gradient-to-r from-primary to-emerald-500 text-white",
                  "hover:shadow-lg hover:shadow-primary/25 active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {loadingAudio ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : playing ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <Volume2 className="w-4 h-4" />
                {loadingAudio ? "Generating…" : playing ? "Pause Audio" : "Listen to Explanation"}
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
