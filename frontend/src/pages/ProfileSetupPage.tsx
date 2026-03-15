import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { motion, AnimatePresence } from "framer-motion";
import { User, HeartPulse, Phone, ChevronRight, ChevronLeft, Check, X } from "lucide-react";

/* ── Types ── */
interface ProfileData {
  full_name: string;
  age: string;
  gender: string;
  blood_group: string;
  allergies: string[];
  conditions: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Medical Info", icon: HeartPulse },
  { label: "Emergency Contact", icon: Phone },
];

/* ── Tag Input ── */
function TagInput({
  tags,
  setTags,
  placeholder,
}: {
  tags: string[];
  setTags: (t: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) {
      setTags([...tags, v]);
    }
    setInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => setTags(tags.filter((t) => t !== tag))}
              className="hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
      />
      <p className="text-[11px] text-gray-400 mt-1">Type and press Enter to add</p>
    </div>
  );
}

/* ── Input component ── */
function FormInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border border-gray-200 text-gray-900 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer"
      >
        <option value="">{placeholder ?? "Select..."}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Main Page ── */
export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileData>({
    full_name: session?.user?.user_metadata?.full_name ?? "",
    age: "",
    gender: "",
    blood_group: "",
    allergies: [],
    conditions: [],
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const set = <K extends keyof ProfileData>(key: K, val: ProfileData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const next = () => {
    setDir(1);
    setStep((s) => Math.min(s + 1, 2));
  };
  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = async () => {
    if (!session?.user?.id) return;
    setError(null);
    setSaving(true);
    try {
      const { error: err } = await supabase.from("profiles").upsert({
        id: session.user.id,
        full_name: form.full_name,
        age: parseInt(form.age) || null,
        gender: form.gender || null,
        blood_group: form.blood_group || null,
        allergies: form.allergies,
        conditions: form.conditions,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      });
      if (err) throw err;
      navigate("/");
    } catch (e: any) {
      setError(e.message ?? "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step + 1) / 3) * 100;

  const stepVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: -d * 40 }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <User className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Help us personalize your PharmacoGuard experience</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done
                        ? "bg-indigo-600 text-white"
                        : active
                          ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {done ? <Check size={14} /> : <StepIcon size={14} />}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      active ? "text-indigo-600" : done ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-violet-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Personal Information</h2>
                  <FormInput
                    label="Full Name"
                    value={form.full_name}
                    onChange={(v) => set("full_name", v)}
                    placeholder="John Doe"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormInput
                      label="Age"
                      type="number"
                      value={form.age}
                      onChange={(v) => set("age", v)}
                      placeholder="25"
                    />
                    <FormSelect
                      label="Gender"
                      value={form.gender}
                      onChange={(v) => set("gender", v)}
                      options={GENDERS}
                      placeholder="Select gender"
                    />
                  </div>
                  <FormSelect
                    label="Blood Group"
                    value={form.blood_group}
                    onChange={(v) => set("blood_group", v)}
                    options={BLOOD_GROUPS}
                    placeholder="Select blood group"
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Medical Information</h2>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Known Allergies</label>
                    <TagInput
                      tags={form.allergies}
                      setTags={(t) => set("allergies", t)}
                      placeholder="e.g. Penicillin, Peanuts"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Existing Conditions</label>
                    <TagInput
                      tags={form.conditions}
                      setTags={(t) => set("conditions", t)}
                      placeholder="e.g. Diabetes, Hypertension"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Emergency Contact</h2>
                  <FormInput
                    label="Contact Name"
                    value={form.emergency_contact_name}
                    onChange={(v) => set("emergency_contact_name", v)}
                    placeholder="Jane Doe"
                  />
                  <FormInput
                    label="Contact Phone"
                    type="tel"
                    value={form.emergency_contact_phone}
                    onChange={(v) => set("emergency_contact_phone", v)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} /> Back
            </button>

            {step < 2 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-indigo-200 transition-all"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex items-center gap-1 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md hover:shadow-indigo-200 disabled:opacity-60 transition-all"
              >
                {saving ? "Saving…" : "Complete Profile"} <Check size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
