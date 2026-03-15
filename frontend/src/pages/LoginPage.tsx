import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, Stethoscope } from "lucide-react";

// ── Custom SVG Logo ────────────────────────────────────────────────
function PharmacoLogo({ size = 64 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="shield-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="inner-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E0E7FF" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      {/* Shield body */}
      <path
        d="M32 4L8 14v18c0 14 11 24 24 28 13-4 24-14 24-28V14L32 4z"
        fill="url(#shield-grad)"
      />
      {/* Pill cross inside */}
      <rect x="29" y="20" width="6" height="24" rx="3" fill="url(#inner-grad)" />
      <rect x="20" y="29" width="24" height="6" rx="3" fill="url(#inner-grad)" />
    </svg>
  );
}

// ── Animated Gradient Orb ──────────────────────────────────────────
function HeroOrb() {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 340, height: 340 }}>
      {/* Outer glow ring */}
      <div
        className="absolute rounded-full animate-orb-pulse"
        style={{
          width: 340,
          height: 340,
          background:
            "radial-gradient(circle at 40% 35%, #7C3AED 0%, #4F46E5 35%, #6D28D9 60%, transparent 75%)",
          filter: "blur(2px)",
          opacity: 0.45,
        }}
      />
      {/* Mid orb */}
      <div
        className="absolute rounded-full animate-orb-drift"
        style={{
          width: 260,
          height: 260,
          background:
            "radial-gradient(circle at 38% 38%, #8B5CF6 0%, #6366F1 45%, #4338CA 80%)",
          filter: "blur(1px)",
          boxShadow: "0 0 80px 30px rgba(124,58,237,0.45), 0 0 160px 60px rgba(99,102,241,0.2)",
        }}
      />
      {/* Core bright spot */}
      <div
        className="absolute rounded-full"
        style={{
          width: 120,
          height: 120,
          background:
            "radial-gradient(circle at 40% 35%, #C4B5FD 0%, #A78BFA 50%, transparent 80%)",
          filter: "blur(2px)",
          opacity: 0.85,
        }}
      />
    </div>
  );
}

// ── Feature Pill ───────────────────────────────────────────────────
function FeaturePill({ label }: { label: string }) {
  return (
    <span
      className="px-3 py-1.5 text-xs font-medium text-white rounded-full"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(8px)",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

// ── Left Hero Panel ────────────────────────────────────────────────
function HeroPanel() {
  return (
    <div
      className="hidden lg:flex flex-col items-center justify-between w-1/2 min-h-screen px-12 py-14"
      style={{ background: "#0F0A1E" }}
    >
      {/* Spacer top */}
      <div />

      {/* Center content */}
      <div className="flex flex-col items-center gap-6 text-center">
        <HeroOrb />

        <div className="flex flex-col items-center gap-2 -mt-6">
          <PharmacoLogo size={60} />
          <h1
            className="text-4xl font-extrabold tracking-tight"
            style={{ color: "#FFFFFF", lineHeight: 1.1 }}
          >
            PharmacoGuard
          </h1>
          <p className="text-sm font-medium mt-1" style={{ color: "#A78BFA" }}>
            Your AI-Powered Medication Guardian
          </p>
        </div>
      </div>

      {/* Feature pills bottom */}
      <div className="flex flex-wrap justify-center gap-2">
        <FeaturePill label="🛡️ DDI Detection" />
        <FeaturePill label="💊 Smart Scheduler" />
        <FeaturePill label="🧬 Hormone Sync" />
      </div>
    </div>
  );
}

// ── Shared input ───────────────────────────────────────────────────
function AuthInput({
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
}: {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="
        w-full px-4 py-3 rounded-xl text-sm
        bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400
        outline-none transition-all
        focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200
      "
    />
  );
}

// ── Sign In Form ───────────────────────────────────────────────────
function SignInForm() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const setRole = useAuthStore((s) => s.setRole);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data.session) {
      setSession(data.session);
      const role = data.session.user.user_metadata?.role ?? "patient";
      setRole(role);
      navigate("/");
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <AuthInput
        type="email"
        placeholder="Email address"
        value={email}
        onChange={setEmail}
        required
      />
      <div className="relative">
        <AuthInput
          type={showPw ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={setPassword}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
          tabIndex={-1}
        >
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
        >
          Forgot password?
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white btn-shimmer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}

// ── Sign Up Form ───────────────────────────────────────────────────
function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-3">
        <div className="mx-auto w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>
        <p className="font-semibold text-gray-800">Account created!</p>
        <p className="text-sm text-gray-500">
          Check your email to confirm your account, then sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <AuthInput
        placeholder="Full name"
        value={fullName}
        onChange={setFullName}
        required
      />
      <AuthInput
        type="email"
        placeholder="Email address"
        value={email}
        onChange={setEmail}
        required
      />
      <div className="relative">
        <AuthInput
          type={showPw ? "text" : "password"}
          placeholder="Password"
          value={password}
          onChange={setPassword}
          required
        />
        <button
          type="button"
          onClick={() => setShowPw((p) => !p)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors"
          tabIndex={-1}
        >
          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Role selector cards */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">I am a…</p>
        <div className="grid grid-cols-2 gap-3">
          {(["patient", "doctor"] as const).map((r) => {
            const active = role === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`
                  flex flex-col items-center gap-2 py-3 px-4 rounded-xl border-2 transition-all text-sm font-medium
                  ${active
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-indigo-200 hover:bg-indigo-50/40"}
                `}
              >
                {r === "patient"
                  ? <User size={20} className={active ? "text-indigo-600" : "text-gray-400"} />
                  : <Stethoscope size={20} className={active ? "text-indigo-600" : "text-gray-400"} />
                }
                <span className="capitalize">{r}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-white btn-shimmer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>
    </form>
  );
}

// ── Tab Switcher ───────────────────────────────────────────────────
const TABS = ["Sign In", "Sign Up"] as const;
type Tab = (typeof TABS)[number];

const tabVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 24 }),
};

// ── Main Export ────────────────────────────────────────────────────
export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Sign In");
  const [dir, setDir] = useState(1);

  const switchTab = (tab: Tab) => {
    setDir(tab === "Sign Up" ? 1 : -1);
    setActiveTab(tab);
  };

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Left hero ──────────────────────────────────────────── */}
      <HeroPanel />

      {/* ── Right form ─────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-white px-8 py-12 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Mobile logo (shown when left panel is hidden) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <PharmacoLogo size={48} />
            <h1 className="text-2xl font-extrabold text-gray-900 mt-2">PharmacoGuard</h1>
            <p className="text-xs text-indigo-400 mt-0.5">Your AI-Powered Medication Guardian</p>
          </div>

          {/* Heading */}
          <div className="mb-6 lg:block hidden">
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "Sign In" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "Sign In"
                ? "Sign in to manage your medications."
                : "Join PharmacoGuard today."}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 mb-6 relative">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`
                  relative flex-1 py-2.5 text-sm font-semibold transition-colors
                  ${activeTab === tab ? "text-indigo-600" : "text-gray-400 hover:text-gray-600"}
                `}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "linear-gradient(90deg, #4F46E5, #7C3AED)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Animated form content */}
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={activeTab}
              custom={dir}
              variants={tabVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {activeTab === "Sign In" ? <SignInForm /> : <SignUpForm />}
            </motion.div>
          </AnimatePresence>

          {/* Bottom switch hint */}
          <p className="mt-6 text-center text-xs text-gray-400">
            {activeTab === "Sign In" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => switchTab("Sign Up")}
                  className="text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchTab("Sign In")}
                  className="text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
