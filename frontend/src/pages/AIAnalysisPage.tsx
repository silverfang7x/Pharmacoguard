import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AIAnalysisPage() {
  const [medications, setMedications] = useState("");

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">AI Analysis</h1>

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
    </div>
  );
}
