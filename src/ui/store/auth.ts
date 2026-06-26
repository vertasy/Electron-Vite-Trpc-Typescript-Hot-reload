// stores/auth.ts
import { create } from "zustand";

type AuthState = {
  unlocked: boolean;
  unlock: () => void;
  lock: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  unlocked: false,
  unlock: () => set({ unlocked: true }),
  lock: () => set({ unlocked: false })
}));
