import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdverseEvent {
  id: string;
  severity: string;
  description: string;
  status: string;
  created_at: string;
}

export default function AdverseEventsPage() {
  const { data: events, isLoading } = useQuery<AdverseEvent[]>({
    queryKey: ["adverse-events"],
    queryFn: () => api.get("/adverse-events").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Adverse Events</h1>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : events?.length ? (
        <div className="space-y-4">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="capitalize">{ev.severity} severity</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded">{ev.status}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{ev.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Reported: {new Date(ev.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">No adverse events reported.</p>
      )}
    </div>
  );
}
