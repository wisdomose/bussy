import { User, USER_ROLE } from "@/types";
import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

type AuthState = {
  role?: USER_ROLE;
  profile?: User;
  setRole: (role?: USER_ROLE) => void;
  setProfile: (profile?: User) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        role: undefined,
        profile: undefined,
        setRole: (role?: USER_ROLE) => set({ role }),
        setProfile: (profile?: User) => set({ profile }),
        logout: () => set((state) => ({ ...state }), true),
      }),
      {
        name: "auth",
      }
    )
  )
);
