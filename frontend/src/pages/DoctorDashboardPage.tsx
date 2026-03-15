import { useState, useEffect } from "react";
import { Stethoscope } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import KpiCards from "@/components/analytics/KpiCards";
import AdherenceLineChart from "@/components/analytics/AdherenceLineChart";
import SideEffectBarChart from "@/components/analytics/SideEffectBarChart";
import AdherenceDonutChart from "@/components/analytics/AdherenceDonutChart";
import LowAdherenceTable from "@/components/analytics/LowAdherenceTable";

/* ── Type mirrors ── */
interface DrugAdherenceStat { drug_name: string; adherence_rate: number }
interface SideEffectStat { drug_name: string; side_effect: string; count: number }
interface AdherenceDistBucket { bucket: string; count: number }
interface LowAdherencePatient { patient_id: string; initials: string; adherence_rate: number; missed_doses_this_week: number; primary_drug: string }

interface DashboardData {
  overview: {
    total_patients: number;
    avg_adherence_rate: number;
    top_non_adhered_drugs: DrugAdherenceStat[];
    common_side_effects_by_drug: SideEffectStat[];
    ddi_flags_this_month: number;
  };
  adherence_distribution: AdherenceDistBucket[];
  low_adherence_patients: LowAdherencePatient[];
  refill_alerts_count: number;
}

/* ── Demo data ── */
const DEMO: DashboardData = {
  overview: {
    total_patients: 1284,
    avg_adherence_rate: 0.742,
    top_non_adhered_drugs: [
      { drug_name: "Metformin 500mg", adherence_rate: 0.52 },
      { drug_name: "Lisinopril 10mg", adherence_rate: 0.61 },
      { drug_name: "Atorvastatin 20mg", adherence_rate: 0.67 },
      { drug_name: "Amlodipine 5mg", adherence_rate: 0.71 },
      { drug_name: "Omeprazole 20mg", adherence_rate: 0.74 },
    ],
    common_side_effects_by_drug: [
      { drug_name: "Metformin", side_effect: "Nausea", count: 187 },
      { drug_name: "Metformin", side_effect: "Diarrhea", count: 134 },
      { drug_name: "Lisinopril", side_effect: "Dry cough", count: 96 },
      { drug_name: "Atorvastatin", side_effect: "Muscle pain", count: 78 },
      { drug_name: "Amlodipine", side_effect: "Edema", count: 63 },
      { drug_name: "Omeprazole", side_effect: "Headache", count: 45 },
    ],
    ddi_flags_this_month: 23,
  },
  adherence_distribution: [
    { bucket: "90-100%", count: 412 },
    { bucket: "80-89%", count: 298 },
    { bucket: "70-79%", count: 264 },
    { bucket: "60-69%", count: 187 },
    { bucket: "<60%", count: 123 },
  ],
  low_adherence_patients: [
    { patient_id: "a1b2", initials: "P-A1B2", adherence_rate: 0.21, missed_doses_this_week: 11, primary_drug: "Metformin 500mg" },
    { patient_id: "c3d4", initials: "P-C3D4", adherence_rate: 0.35, missed_doses_this_week: 9, primary_drug: "Lisinopril 10mg" },
    { patient_id: "e5f6", initials: "P-E5F6", adherence_rate: 0.42, missed_doses_this_week: 8, primary_drug: "Atorvastatin 20mg" },
    { patient_id: "g7h8", initials: "P-G7H8", adherence_rate: 0.48, missed_doses_this_week: 7, primary_drug: "Sertraline 50mg" },
    { patient_id: "i9j0", initials: "P-I9J0", adherence_rate: 0.53, missed_doses_this_week: 6, primary_drug: "Amlodipine 5mg" },
  ],
  refill_alerts_count: 17,
};

const DEMO_LINE_SERIES = [
  { drug_name: "Metformin 500mg", data: Array.from({ length: 30 }, (_, i) => ({ day: i, adherence_rate: Math.max(0.3, 0.85 - i * 0.012 + Math.sin(i / 3) * 0.05) })) },
  { drug_name: "Lisinopril 10mg", data: Array.from({ length: 30 }, (_, i) => ({ day: i, adherence_rate: Math.max(0.4, 0.78 - i * 0.008 + Math.cos(i / 4) * 0.04) })) },
  { drug_name: "Atorvastatin 20mg", data: Array.from({ length: 30 }, (_, i) => ({ day: i, adherence_rate: Math.max(0.45, 0.90 - i * 0.010 + Math.sin(i / 5) * 0.03) })) },
  { drug_name: "Amlodipine 5mg", data: Array.from({ length: 30 }, (_, i) => ({ day: i, adherence_rate: Math.max(0.5, 0.82 - i * 0.006 + Math.cos(i / 2) * 0.04) })) },
  { drug_name: "Omeprazole 20mg", data: Array.from({ length: 30 }, (_, i) => ({ day: i, adherence_rate: Math.max(0.5, 0.88 - i * 0.009 + Math.sin(i / 4) * 0.03) })) },
];

export default function DoctorDashboardPage() {
  const session = useAuthStore((s) => s.session);
  const [data, setData] = useState<DashboardData>(DEMO);
  const [lineSeries] = useState(DEMO_LINE_SERIES);

  useEffect(() => {
    if (!session?.user?.id) return;
    const doctorId = session.user.id;

    api
      .get(`/api/v1/analytics/doctor/${doctorId}/dashboard`)
      .then((r) => setData(r.data))
      .catch(() => {
        /* keep demo data on failure */
      });
  }, [session?.user?.id]);

  return (
    <div className="min-h-screen bg-slate-900 -m-8 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Doctor Analytics
            </h1>
            <p className="text-sm text-slate-400">
              Anonymised, aggregated patient insights
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <KpiCards
          totalPatients={data.overview.total_patients}
          avgAdherence={data.overview.avg_adherence_rate}
          ddiFlags={data.overview.ddi_flags_this_month}
          refillAlerts={data.refill_alerts_count}
        />

        {/* Charts Row 1: Line + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AdherenceLineChart series={lineSeries} />
          </div>
          <AdherenceDonutChart data={data.adherence_distribution} />
        </div>

        {/* Charts Row 2: Bar + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SideEffectBarChart data={data.overview.common_side_effects_by_drug} />
          <LowAdherenceTable patients={data.low_adherence_patients} />
        </div>
      </div>
    </div>
  );
}
