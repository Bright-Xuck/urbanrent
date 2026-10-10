import { create } from "zustand";
import type { Role } from "../api/types";


export type User = {
  id: string;
  email: string | null;
  role: Role;
};

export type SessionStatus = "checking" | "authenticated" | "anonymous" | "error";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  sessionStatus: SessionStatus;
  sessionNotice: string | null;
  login: (user: User, accessToken: string) => void;
  logout: (notice?: string | null) => void;
  setSessionStatus: (status: SessionStatus) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  sessionStatus: "checking",
  sessionNotice: null,
  login: (user, accessToken) => {
    set({
      user,
      accessToken,
      sessionStatus: "authenticated",
      sessionNotice: null,
    });
  },
  logout: (sessionNotice: string | null = null) => {
    set({
      user: null,
      accessToken: null,
      sessionStatus: "anonymous",
      sessionNotice,
    });
  },
  setSessionStatus: (sessionStatus) => {
    set({ sessionStatus });
  },
}));
