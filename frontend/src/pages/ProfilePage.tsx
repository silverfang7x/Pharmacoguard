import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/auth-store";
import { motion } from "framer-motion";
import { User, HeartPulse, Phone, Edit3, Save, X, Loader2 } from "lucide-react";
import MeshBackground from "@/components/shared/MeshBackground";

interface Profile {
  full_name: string;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string[];
  conditions: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  hormone_sync_enabled: boolean;
}

const EMPTY: Profile = {
  full_name: "",
  age: null,
  gender: null,
  blood_group: null,
  allergies: [],
  conditions: [],
  emergency_contact_name: null,
  emergency_contact_phone: null,
  hormone_sync_enabled: false,
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

/* ── Tag list (view / edit) ── */
function TagList({ tags, editing, setTags, placeholder }: { tags: string[]; editing: boolean; setTags: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");
  if (!editing) {
    return tags.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-block px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">{t}</span>
        ))}
      </div>
    ) : (
      <span className="text-sm text-gray-400">None specified</span>
    );
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500"><X size={10} /></button>
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
            const v = input.trim();
            if (v && !tags.includes(v)) setTags([...tags, v]);
            setInput("");
          }
        }}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}

/* ── Section Card ── */
function SectionCard({
  icon: Icon,
  title,
  color,
  editing,
  onEdit,
  onSave,
  onCancel,
  saving,
  children,
}: {
  icon: any;
  title: string;
  color: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/80 shadow-md hover:shadow-xl hover:shadow-indigo-100 transition-all duration-300">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50/50">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X size={16} /></button>
              <button onClick={onSave} disabled={saving} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-60">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
            </>
          ) : (
            <button onClick={onEdit} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 transition-all">
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>
      </div>
      <div className="px-6 py-5 space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, value, editing, onChange, type = "text", options }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void; type?: string; options?: string[];
}) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      {editing ? (
        options ? (
          <select value={value} onChange={(e) => onChange(e.target.value)} className="col-span-2 px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200">
            <option value="">Select...</option>
            {options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="col-span-2 px-3 py-2 rounded-lg text-sm bg-gray-50 border border-gray-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200" />
        )
      ) : (
        <span className="col-span-2 text-sm text-gray-900">{value || <span className="text-gray-400">Not set</span>}</span>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function ProfilePage() {
  const session = useAuthStore((s) => s.session);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const p: Profile = {
            full_name: data.full_name ?? "",
            age: data.age ?? null,
            gender: data.gender ?? null,
            blood_group: data.blood_group ?? null,
            allergies: data.allergies ?? [],
            conditions: data.conditions ?? [],
            emergency_contact_name: data.emergency_contact_name ?? null,
            emergency_contact_phone: data.emergency_contact_phone ?? null,
            hormone_sync_enabled: data.hormone_sync_enabled ?? false,
          };
          setProfile(p);
          setDraft(p);
        }
        setLoading(false);
      });
  }, [session?.user?.id]);

  const startEdit = (section: string) => {
    setDraft({ ...profile });
    setEditSection(section);
  };

  const cancelEdit = () => setEditSection(null);

  const saveSection = async () => {
    if (!session?.user?.id) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: session.user.id,
      ...draft,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (!error) {
      setProfile({ ...draft });
      setEditSection(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-24">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your profile...</p>
      </div>
    );
  }

  const editing = (s: string) => editSection === s;

  return (
    <motion.div
      className="max-w-3xl mx-auto space-y-6 relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <MeshBackground theme="profile" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal and medical information</p>
      </div>

      {/* Personal Info */}
      <SectionCard
        icon={User}
        title="Personal Information"
        color="bg-gradient-to-br from-indigo-600 to-violet-600"
        editing={editing("personal")}
        onEdit={() => startEdit("personal")}
        onSave={saveSection}
        onCancel={cancelEdit}
        saving={saving}
      >
        <Field label="Full Name" value={editing("personal") ? draft.full_name : profile.full_name} editing={editing("personal")} onChange={(v) => setDraft({ ...draft, full_name: v })} />
        <Field label="Age" value={String(editing("personal") ? (draft.age ?? "") : (profile.age ?? ""))} editing={editing("personal")} onChange={(v) => setDraft({ ...draft, age: parseInt(v) || null })} type="number" />
        <Field label="Gender" value={(editing("personal") ? draft.gender : profile.gender) ?? ""} editing={editing("personal")} onChange={(v) => setDraft({ ...draft, gender: v })} options={["Male", "Female", "Non-binary", "Prefer not to say"]} />
        <Field label="Blood Group" value={(editing("personal") ? draft.blood_group : profile.blood_group) ?? ""} editing={editing("personal")} onChange={(v) => setDraft({ ...draft, blood_group: v })} options={BLOOD_GROUPS} />
      </SectionCard>

      {/* Medical Info */}
      <SectionCard
        icon={HeartPulse}
        title="Medical Information"
        color="bg-gradient-to-br from-rose-500 to-pink-600"
        editing={editing("medical")}
        onEdit={() => startEdit("medical")}
        onSave={saveSection}
        onCancel={cancelEdit}
        saving={saving}
      >
        <div>
          <span className="text-sm font-medium text-gray-500 block mb-1.5">Allergies</span>
          <TagList tags={editing("medical") ? draft.allergies : profile.allergies} editing={editing("medical")} setTags={(t) => setDraft({ ...draft, allergies: t })} placeholder="Add allergy..." />
        </div>
        <div>
          <span className="text-sm font-medium text-gray-500 block mb-1.5">Conditions</span>
          <TagList tags={editing("medical") ? draft.conditions : profile.conditions} editing={editing("medical")} setTags={(t) => setDraft({ ...draft, conditions: t })} placeholder="Add condition..." />
        </div>
        
        {/* Hormone Sync Toggle (Only visible if female) */}
        {((editing("personal") ? draft.gender : profile.gender) === "Female") && (
          <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                Hormone Sync 🌸
              </label>
              <p className="text-xs text-gray-500 mt-0.5">Track menstrual cycle and medication correlation</p>
            </div>
            <button
              type="button"
              disabled={!editing("medical")}
              onClick={() => setDraft({ ...draft, hormone_sync_enabled: !draft.hormone_sync_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 ${
                (editing("medical") ? draft.hormone_sync_enabled : profile.hormone_sync_enabled) ? "bg-pink-500" : "bg-gray-300"
              } ${!editing("medical") && "opacity-60 cursor-not-allowed"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (editing("medical") ? draft.hormone_sync_enabled : profile.hormone_sync_enabled) ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}
      </SectionCard>

      {/* Emergency Contact */}
      <SectionCard
        icon={Phone}
        title="Emergency Contact"
        color="bg-gradient-to-br from-amber-500 to-orange-600"
        editing={editing("emergency")}
        onEdit={() => startEdit("emergency")}
        onSave={saveSection}
        onCancel={cancelEdit}
        saving={saving}
      >
        <Field label="Name" value={(editing("emergency") ? draft.emergency_contact_name : profile.emergency_contact_name) ?? ""} editing={editing("emergency")} onChange={(v) => setDraft({ ...draft, emergency_contact_name: v })} />
        <Field label="Phone" value={(editing("emergency") ? draft.emergency_contact_phone : profile.emergency_contact_phone) ?? ""} editing={editing("emergency")} onChange={(v) => setDraft({ ...draft, emergency_contact_phone: v })} type="tel" />
      </SectionCard>
    </motion.div>
  );
}
