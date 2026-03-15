import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/layout/Layout";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import DashboardPage from "@/pages/DashboardPage";
import MedicationsPage from "@/pages/MedicationsPage";
import AdverseEventsPage from "@/pages/AdverseEventsPage";
import AIAnalysisPage from "@/pages/AIAnalysisPage";
import SchedulerPage from "@/pages/SchedulerPage";
import KnowledgeVaultPage from "@/pages/KnowledgeVaultPage";
import HormoneSyncPage from "@/pages/HormoneSyncPage";
import GamificationPage from "@/pages/GamificationPage";
import DoctorDashboardPage from "@/pages/DoctorDashboardPage";
import ProfileSetupPage from "@/pages/ProfileSetupPage";
import ProfilePage from "@/pages/ProfilePage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const [checking, setChecking] = useState(true);
  const [profileComplete, setProfileComplete] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) { setChecking(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, age, blood_group, profile_complete")
          .eq("id", session.user.id)
          .single();
        if (!data || !data.profile_complete) {
          setProfileComplete(false);
        }
      } catch {
        // If profiles table doesn't exist or query fails, skip the check
        setProfileComplete(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [session?.user?.id]);

  if (!session) return <Navigate to="/login" replace />;
  if (checking) return null; // brief loading
  if (!profileComplete && window.location.pathname !== "/profile-setup") {
    return <Navigate to="/profile-setup" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="medications" element={<MedicationsPage />} />
        <Route path="knowledge-vault" element={<KnowledgeVaultPage />} />
        <Route path="adverse-events" element={<AdverseEventsPage />} />
        <Route path="ai-analysis" element={<AIAnalysisPage />} />
        <Route path="scheduler" element={<SchedulerPage />} />
        <Route path="hormone-sync" element={<HormoneSyncPage />} />
        <Route path="gamification" element={<GamificationPage />} />
        <Route path="doctor" element={<DoctorDashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
