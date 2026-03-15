import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Pill, AlertTriangle, Brain, LayoutDashboard, LogOut,
  CalendarClock, BookOpen, Activity, Trophy, Stethoscope, Home,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import DoctorChat from "@/components/shared/DoctorChat";

const navItems = [
  { to: "/home",            label: "Home",             icon: Home,            accent: "indigo" },
  { to: "/dashboard",       label: "Dashboard",        icon: LayoutDashboard, accent: "indigo" },
  { to: "/medications",     label: "Medications",      icon: Pill,            accent: "violet" },
  { to: "/knowledge-vault", label: "Drug Info",        icon: BookOpen,        accent: "blue" },
  { to: "/scheduler",       label: "Med Schedule",     icon: CalendarClock,   accent: "emerald" },
  { to: "/adverse-events",  label: "Adverse Events",   icon: AlertTriangle,   accent: "rose" },
  { to: "/ai-analysis",     label: "AI Analysis",      icon: Brain,           accent: "amber" },
  { to: "/hormone-sync",    label: "Hormone-Sync",     icon: Activity,        accent: "pink" },
  { to: "/gamification",    label: "Gamification",     icon: Trophy,          accent: "orange" },
  { to: "/doctor",          label: "Doctor Analytics", icon: Stethoscope,     accent: "cyan" },
];

const activeColors: Record<string, string> = {
  indigo:  "bg-indigo-600 text-white shadow-md shadow-indigo-600/20",
  violet:  "bg-violet-600 text-white shadow-md shadow-violet-600/20",
  blue:    "bg-blue-600 text-white shadow-md shadow-blue-600/20",
  emerald: "bg-emerald-600 text-white shadow-md shadow-emerald-600/20",
  rose:    "bg-rose-600 text-white shadow-md shadow-rose-600/20",
  amber:   "bg-amber-600 text-white shadow-md shadow-amber-600/20",
  pink:    "bg-pink-600 text-white shadow-md shadow-pink-600/20",
  orange:  "bg-orange-600 text-white shadow-md shadow-orange-600/20",
  cyan:    "bg-cyan-600 text-white shadow-md shadow-cyan-600/20",
};

const hoverBorders: Record<string, string> = {
  indigo:  "hover:border-indigo-600",
  violet:  "hover:border-violet-600",
  blue:    "hover:border-blue-600",
  emerald: "hover:border-emerald-600",
  rose:    "hover:border-rose-600",
  amber:   "hover:border-amber-600",
  pink:    "hover:border-pink-600",
  orange:  "hover:border-orange-600",
  cyan:    "hover:border-cyan-600",
};

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);
  const location = useLocation();

  // Full-bleed pages that need no sidebar padding
  const isFullBleed = location.pathname === "/home";

  return (
    <div className="flex h-screen">
      {/* ── Sidebar ── */}
      <aside
        className="w-64 flex flex-col shrink-0"
        style={{ background: "#0F0A1E" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-indigo-900/60">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">PharmacoGuard</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, accent }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/home"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? activeColors[accent] || activeColors.indigo
                    : `text-gray-300 hover:text-white hover:bg-indigo-950 hover:border-l-2 hover:pl-[10px] ${hoverBorders[accent] || hoverBorders.indigo}`,
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: Profile + Role + Sign Out */}
        <div className="border-t border-indigo-900/60 p-3 space-y-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-indigo-950",
              )
            }
          >
            <UserCircle className="h-4 w-4" />
            My Profile
          </NavLink>

          {role && (
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 ml-3 tracking-wider">
              {role}
            </span>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all duration-200 w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className={cn(
          "flex-1 overflow-auto bg-transparent",
          isFullBleed ? "" : "p-8",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global AI Chatbot */}
      <DoctorChat />
    </div>
  );
}
