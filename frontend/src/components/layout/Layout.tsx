import { Outlet, NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Shield, Pill, AlertTriangle, Brain, LayoutDashboard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/medications", label: "Medications", icon: Pill },
  { to: "/adverse-events", label: "Adverse Events", icon: AlertTriangle },
  { to: "/ai-analysis", label: "AI Analysis", icon: Brain },
];

export default function Layout() {
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold">PharmacoGuard</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground mb-2 capitalize">Role: {role ?? "—"}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
