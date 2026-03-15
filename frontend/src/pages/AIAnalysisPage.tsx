import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DDIWarningModal, {
  type DDICheckResult,
} from "@/components/ddi/DDIWarningModal";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";

export default function AIAnalysisPage() {
  const [medications, setMedications] = useState("");
  const [newDrug, setNewDrug] = useState("");
  const [existingMeds, setExistingMeds] = useState("");
  const [ddiResult, setDdiResult] = useState<DDICheckResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  /* ── Generic AI interaction check ── */
  const interactionMutation = useMutation({
    mutationFn: (meds: string[]) =>
      api.post("/ai/drug-interactions", { medications: meds }).then((r) => r.data),
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const meds = medications
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (meds.length >= 2) interactionMutation.mutate(meds);
  };

  /* ── DDI Safety Engine check ── */
  const ddiMutation = useMutation({
    mutationFn: (body: { patient_id: string; new_drug: string; existing_medications: string[] }) =>
      api.post<DDICheckResult>("/safety/check-interactions", body).then((r) => r.data),
    onSuccess: (data) => {
      setDdiResult(data);
      setModalOpen(true);
    },
  });

  const handleDDICheck = (e: React.FormEvent) => {
    e.preventDefault();
    const meds = existingMeds
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (newDrug.trim() && meds.length > 0) {
      ddiMutation.mutate({
        patient_id: "self",
        new_drug: newDrug.trim(),
        existing_medications: meds,
      });
    }
  };

  return (
    <div className="space-y-6 relative">
      <MeshBackground theme="ai" />
      <PageHeader
        accent="amber"
        emoji="🤖"
        title="AI Analysis"
        subtitle="Intelligent health insights powered by Groq"
        rightContent={
          <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-amber-200 transition-all">
            Run Analysis
          </button>
        }
      />

      {/* ── DDI Safety Engine ── */}
      <Card className="border-white/80 bg-white/70 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            DDI Safety Engine
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDDICheck} className="space-y-4">
            <Input
              placeholder="New drug being prescribed"
              value={newDrug}
              onChange={(e) => setNewDrug(e.target.value)}
            />
            <Input
              placeholder="Existing medications (comma-separated)"
              value={existingMeds}
              onChange={(e) => setExistingMeds(e.target.value)}
            />
            <Button type="submit" disabled={ddiMutation.isPending}>
              {ddiMutation.isPending ? "Checking safety…" : "Run Safety Check"}
            </Button>
          </form>

          {ddiMutation.isError && (
            <p className="mt-4 text-sm text-destructive">Safety check failed. Please try again.</p>
          )}
        </CardContent>
      </Card>

      {/* ── Basic AI interaction checker ── */}
      <Card>
        <CardHeader>
          <CardTitle>Drug Interaction Checker</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheck} className="space-y-4">
            <Input
              placeholder="Enter medications separated by commas (min 2)"
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
            />
            <Button type="submit" disabled={interactionMutation.isPending}>
              {interactionMutation.isPending ? "Analysing…" : "Check Interactions"}
            </Button>
          </form>

          {interactionMutation.data && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold">Results</h3>
              <p className="text-sm">{interactionMutation.data.summary}</p>
              {interactionMutation.data.interactions?.map(
                (interaction: Record<string, string>, i: number) => (
                  <div key={i} className="rounded border p-3 text-sm">
                    <p className="font-medium">{interaction.drug_pair}</p>
                    <p className="text-muted-foreground">{interaction.description}</p>
                    <span className="text-xs capitalize bg-secondary px-2 py-0.5 rounded mt-1 inline-block">
                      {interaction.severity}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}

          {interactionMutation.isError && (
            <p className="mt-4 text-sm text-destructive">Analysis failed. Please try again.</p>
          )}
        </CardContent>
      </Card>

      {/* ── DDI Warning Modal ── */}
      {ddiResult && (
        <DDIWarningModal
          result={ddiResult}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onConsultDoctor={() => {
            setModalOpen(false);
            alert("Redirecting to doctor consultation…");
          }}
          onAcknowledgeRisk={() => {
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
