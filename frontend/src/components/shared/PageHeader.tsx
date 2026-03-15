import type { ReactNode } from "react";

interface PageHeaderProps {
  emoji: string;
  title: string;
  subtitle: string;
  accent: string;           // tailwind color name: "indigo", "violet", etc.
  rightContent?: ReactNode;
}

/* ── Accent colour maps (Tailwind can't do dynamic classes) ── */
const accentMap: Record<string, { gradient: string; border: string; iconBg: string; subtitleColor: string }> = {
  indigo:  { gradient: "from-indigo-50 to-white",  border: "border-indigo-100",  iconBg: "bg-indigo-100",  subtitleColor: "text-indigo-600" },
  violet:  { gradient: "from-violet-50 to-white",  border: "border-violet-100",  iconBg: "bg-violet-100",  subtitleColor: "text-violet-600" },
  blue:    { gradient: "from-blue-50 to-white",    border: "border-blue-100",    iconBg: "bg-blue-100",    subtitleColor: "text-blue-600" },
  emerald: { gradient: "from-emerald-50 to-white", border: "border-emerald-100", iconBg: "bg-emerald-100", subtitleColor: "text-emerald-600" },
  rose:    { gradient: "from-rose-50 to-white",    border: "border-rose-100",    iconBg: "bg-rose-100",    subtitleColor: "text-rose-600" },
  amber:   { gradient: "from-amber-50 to-white",   border: "border-amber-100",   iconBg: "bg-amber-100",   subtitleColor: "text-amber-600" },
  pink:    { gradient: "from-pink-50 to-white",    border: "border-pink-100",    iconBg: "bg-pink-100",    subtitleColor: "text-pink-600" },
  orange:  { gradient: "from-orange-50 to-white",  border: "border-orange-100",  iconBg: "bg-orange-100",  subtitleColor: "text-orange-600" },
  cyan:    { gradient: "from-cyan-50 to-white",    border: "border-cyan-100",    iconBg: "bg-cyan-100",    subtitleColor: "text-cyan-600" },
};

export default function PageHeader({ emoji, title, subtitle, accent, rightContent }: PageHeaderProps) {
  const colors = accentMap[accent] || accentMap.indigo || { gradient: "", border: "", iconBg: "", subtitleColor: "" };

  return (
    <div className={`-mx-8 -mt-8 mb-8 px-8 py-8 bg-gradient-to-r ${colors.gradient} border-b ${colors.border}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${colors.iconBg} flex items-center justify-center text-2xl shrink-0`}>
            {emoji}
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{title}</h1>
            <p className={`text-sm font-medium ${colors.subtitleColor} mt-0.5`}>{subtitle}</p>
          </div>
        </div>

        {/* Right side */}
        {rightContent && (
          <div className="flex items-center gap-2 flex-wrap">{rightContent}</div>
        )}
      </div>
    </div>
  );
}
