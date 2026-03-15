import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader as CardHeaderComponent, CardTitle } from "@/components/ui/card";
import { Pill } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";

interface Medication {
  id: string;
  name: string;
  generic_name: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
}

const defaultMedications: Medication[] = [
  { id: "d1", name: "Amoxicillin",   generic_name: "Amoxicillin trihydrate",  dosage_form: "Capsule 500mg",  manufacturer: "Cipla Ltd." },
  { id: "d2", name: "Metformin",     generic_name: "Metformin HCl",           dosage_form: "Tablet 850mg",   manufacturer: "Sun Pharma" },
  { id: "d3", name: "Lisinopril",    generic_name: "Lisinopril dihydrate",    dosage_form: "Tablet 10mg",    manufacturer: "Lupin Ltd." },
  { id: "d4", name: "Ibuprofen",     generic_name: "Ibuprofen",               dosage_form: "Tablet 400mg",   manufacturer: "Dr. Reddy's" },
  { id: "d5", name: "Sertraline",    generic_name: "Sertraline HCl",          dosage_form: "Tablet 50mg",    manufacturer: "Zydus Cadila" },
  { id: "d6", name: "Atorvastatin",  generic_name: "Atorvastatin calcium",    dosage_form: "Tablet 20mg",    manufacturer: "Ranbaxy Labs" },
];

export default function MedicationsPage() {
  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["medications"],
    queryFn: () => api.get("/medications").then((r) => r.data),
    retry: 1,
    placeholderData: defaultMedications,
  });

  const mergedMeds = medications && medications.length > 0 ? medications : defaultMedications;

  return (
    <div className="space-y-6 relative">
      <MeshBackground theme="medications" />
      <PageHeader
        accent="violet"
        emoji="💊"
        title="My Medications"
        subtitle="Prescription Knowledge Vault"
        rightContent={
          <>
            <div className="px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 text-sm font-semibold border border-violet-100">
              {mergedMeds.length} Active
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-violet-200 transition-all">
              Add Medication
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mergedMeds.map((med) => (
          <Card key={med.id} className="group bg-white/70 backdrop-blur-sm border-white/80 shadow-sm transition-all hover:bg-white/90 cursor-pointer">
            <CardHeaderComponent className="flex flex-row items-center gap-3 space-y-0 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-base">{med.name}</CardTitle>
            </CardHeaderComponent>
            <CardContent className="space-y-1.5 text-sm text-gray-500">
              {med.generic_name && <p><span className="font-medium text-gray-600">Generic:</span> {med.generic_name}</p>}
              {med.dosage_form && <p><span className="font-medium text-gray-600">Form:</span> {med.dosage_form}</p>}
              {med.manufacturer && <p><span className="font-medium text-gray-600">Manufacturer:</span> {med.manufacturer}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading && mergedMeds === defaultMedications && (
        <p className="text-sm text-gray-400 text-center py-4">Checking for updates from server...</p>
      )}
    </div>
  );
}
