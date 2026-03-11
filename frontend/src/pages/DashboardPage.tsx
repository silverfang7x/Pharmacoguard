import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { Pill, AlertTriangle, Brain, Users } from "lucide-react";

const stats = [
  { label: "Medications tracked", value: "—", icon: Pill },
  { label: "Adverse events", value: "—", icon: AlertTriangle },
  { label: "AI analyses", value: "—", icon: Brain },
  { label: "Active users", value: "—", icon: Users },
];

export default function DashboardPage() {
  const role = useAuthStore((s) => s.role);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back. You are signed in as <span className="font-medium capitalize">{role}</span>.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
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
