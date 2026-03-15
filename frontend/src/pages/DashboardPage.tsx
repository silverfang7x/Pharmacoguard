import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { Pill, AlertTriangle, Brain, Users } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import MeshBackground from "@/components/shared/MeshBackground";

const stats = [
  { label: "Medications tracked", value: "—", icon: Pill },
  { label: "Adverse events", value: "—", icon: AlertTriangle },
  { label: "AI analyses", value: "—", icon: Brain },
  { label: "Active users", value: "—", icon: Users },
];

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role);

  return (
    <div className="space-y-8 relative">
      <MeshBackground theme="dashboard" />
      <PageHeader
        accent="indigo"
        emoji="🏠"
        title="Dashboard"
        subtitle={`Welcome back. You are signed in as ${role}.`}
        rightContent={
          <>
            <div className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-sm font-semibold border border-indigo-100">
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow-indigo-200 transition-all">
              Quick Check-in
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="bg-white/70 backdrop-blur-sm border-white/80 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
