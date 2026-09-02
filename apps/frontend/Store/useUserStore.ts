import { create } from "zustand";

type Auth = {
  user: User | null;
  accessToken: string | null;
  RefreshToken: string | null;
  Register:(User: Omit<User, "id">)=> void
  Login: (user: User) => void;
  Logout: () => void;
};

type User = {
  id: string;
  email: string;
  role: string;
};

export const useAuthStore = create<Auth>((set) => ({
  user: { id: "null", email: "null", role: "null" },
  accessToken: null,
  RefreshToken: null,
  Register:()=>{
    set((state)=>({
        RefreshToken: state.RefreshToken
    }))
  },
  Login:()=>{},
  Logout:()=>{}
}));
