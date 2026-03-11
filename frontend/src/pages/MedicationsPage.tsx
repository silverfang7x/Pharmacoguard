import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Medication {
  id: string;
  name: string;
  generic_name: string | null;
  dosage_form: string | null;
  manufacturer: string | null;
}

export default function MedicationsPage() {
  const { data: medications, isLoading } = useQuery<Medication[]>({
    queryKey: ["medications"],
    queryFn: () => api.get("/medications").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Medications</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : medications?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medications.map((med) => (
            <Card key={med.id}>
              <CardHeader>
                <CardTitle className="text-lg">{med.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                {med.generic_name && <p>Generic: {med.generic_name}</p>}
                {med.dosage_form && <p>Form: {med.dosage_form}</p>}
                {med.manufacturer && <p>Manufacturer: {med.manufacturer}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No medications found.</p>
      )}
    </div>
  );
}
