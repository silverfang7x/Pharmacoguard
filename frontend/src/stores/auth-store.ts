import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "patient" | "doctor" | "admin";

interface AuthState {
  session: Session | null;
  role: UserRole | null;
  setSession: (session: Session | null) => void;
  setRole: (role: UserRole | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      role: null,
      setSession: (session) => set({ session }),
      setRole: (role) => set({ role }),
      logout: () => set({ session: null, role: null }),
    }),
    { name: "pharmacoguard-auth" },
  ),
);
