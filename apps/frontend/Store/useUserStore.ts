import { create } from "zustand";


type Role = "TENANT" | "LANDLORD" | "ADMIN";

export type User = {
  id: string;
  email: string | null;
  role: Role;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  sessionRestoring: boolean;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
  setSessionRestoring: (value: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  sessionRestoring: false,
  login: (user, accessToken) => {
    set({ user, accessToken, sessionRestoring: false });
  },
  logout: () => {
    set({ user: null, accessToken: null, sessionRestoring: false });
  },
  setSessionRestoring: (value) => {
    set({ sessionRestoring: value });
  },
}));
