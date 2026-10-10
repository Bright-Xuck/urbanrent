import { create } from "zustand";
import type { Role } from "../api/types";


export type User = {
  id: string;
  email: string | null;
  role: Role;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  initialized: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  finishInitialization: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  initialized: false,
  login: (user, accessToken) => {
    set({ user, accessToken, initialized: true });
  },
  logout: () => set({ user: null, accessToken: null, initialized: true }),
  finishInitialization: () => set({ initialized: true }),
}));
