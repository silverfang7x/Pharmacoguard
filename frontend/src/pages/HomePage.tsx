import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { Shield } from "lucide-react";
import MeshBackground from "@/components/shared/MeshBackground";

interface FeatureCard {
  emoji: string;
  title: string;
  desc: string;
  to: string;
  accent: string;
  iconBg: string;
  borderTop: string;
  hoverShadow: string;
  badge?: string;
}

const CARDS: FeatureCard[] = [
  { emoji: "🏠", title: "Dashboard",        desc: "Your health at a glance",             to: "/dashboard",       accent: "indigo",  iconBg: "bg-indigo-50 text-indigo-600",   borderTop: "border-t-indigo-500",   hoverShadow: "hover:shadow-indigo-200/60" },
  { emoji: "💊", title: "Medications",       desc: "Manage your prescriptions",           to: "/medications",     accent: "violet",  iconBg: "bg-violet-50 text-violet-600",   borderTop: "border-t-violet-500",   hoverShadow: "hover:shadow-violet-200/60" },
  { emoji: "📖", title: "Drug Info",         desc: "AI-powered drug explanations",        to: "/knowledge-vault", accent: "blue",    iconBg: "bg-blue-50 text-blue-600",       borderTop: "border-t-blue-500",     hoverShadow: "hover:shadow-blue-200/60" },
  { emoji: "🗓️", title: "Med Schedule",      desc: "Never miss a dose",                   to: "/scheduler",       accent: "emerald", iconBg: "bg-emerald-50 text-emerald-600", borderTop: "border-t-emerald-500",  hoverShadow: "hover:shadow-emerald-200/60" },
  { emoji: "⚠️", title: "Adverse Events",    desc: "Track side effects",                  to: "/adverse-events",  accent: "rose",    iconBg: "bg-rose-50 text-rose-600",       borderTop: "border-t-rose-500",     hoverShadow: "hover:shadow-rose-200/60" },
  { emoji: "🤖", title: "AI Analysis",       desc: "Intelligent health insights",         to: "/ai-analysis",     accent: "amber",   iconBg: "bg-amber-50 text-amber-600",     borderTop: "border-t-amber-500",    hoverShadow: "hover:shadow-amber-200/60" },
  { emoji: "🌸", title: "Hormone Sync",      desc: "Cycle & medication tracking",         to: "/hormone-sync",    accent: "pink",    iconBg: "bg-pink-50 text-pink-600",       borderTop: "border-t-pink-500",     hoverShadow: "hover:shadow-pink-200/60" },
  { emoji: "🎮", title: "Gamification",      desc: "Your health streak",                  to: "/gamification",    accent: "orange",  iconBg: "bg-orange-50 text-orange-600",   borderTop: "border-t-orange-500",   hoverShadow: "hover:shadow-orange-200/60" },
  { emoji: "📊", title: "Doctor Analytics",  desc: "Patient adherence & pharma insights", to: "/doctor",          accent: "cyan",    iconBg: "bg-cyan-50 text-cyan-600",       borderTop: "border-t-cyan-500",     hoverShadow: "hover:shadow-cyan-200/60",  badge: "DOCTOR ONLY" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function HomePage() {
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.role);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-transparent">
      {/* ── Shared Mesh Gradient Background ── */}
      <MeshBackground theme="dashboard" />

      {/* ── Hero ── */}
      <motion.div
        className="relative z-10 text-center pt-14 pb-2"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">PharmacoGuard</h1>
        </div>
        <p className="text-gray-500 text-sm font-medium">Your complete AI health companion</p>
        {role && (
          <span className="inline-block mt-3 px-3 py-1 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 tracking-wider">
            {role} mode
          </span>
        )}
      </motion.div>

      {/* ── Feature cards grid ── */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 mt-10 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <motion.button
              key={card.to}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              onClick={() => navigate(card.to)}
              className={`
                relative group text-left p-5 rounded-2xl border border-white/80
                bg-white/70 backdrop-blur-sm
                border-t-4 ${card.borderTop}
                shadow-sm hover:shadow-lg ${card.hoverShadow}
                hover:-translate-y-2 transition-all duration-300
              `}
            >
              {/* Badge for Doctor */}
              {card.badge && (
                <span className="absolute top-3 right-3 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-cyan-50 text-cyan-600 border border-cyan-200 tracking-wider">
                  {card.badge}
                </span>
              )}

              {/* Icon circle */}
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center text-xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {card.emoji}
              </div>

              <h3 className="text-gray-900 font-bold text-base mb-1">{card.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{card.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
