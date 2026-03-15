import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";

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
    <div className="space-y-6 relative">
      <MeshBackground theme="adverse" />
      <PageHeader
        accent="rose"
        emoji="⚠️"
        title="Adverse Events"
        subtitle="Track and report side effects"
        rightContent={
          <button className="px-4 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-rose-200 transition-all">
            Report Event
          </button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-sm mt-4">
          <div className="w-12 h-12 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Checking for reports...</p>
        </div>
      ) : events?.length ? (
        <div className="space-y-4 mt-4">
          {events.map((ev) => (
            <Card key={ev.id} className="bg-white/70 backdrop-blur-sm border-white/80 shadow-sm">
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
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white/50 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-sm mt-4">
          <div className="text-6xl mb-6 bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center shadow-inner">⚠️</div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No side effects reported</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
            Great news! You haven't reported any adverse events. Tracking your side effects helps keep your medication journey safe and effective.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-xl shadow-md hover:shadow-rose-200 transition-all hover:-translate-y-0.5">
            Log an Event
          </button>
        </div>
      )}
    </div>
  );
}
