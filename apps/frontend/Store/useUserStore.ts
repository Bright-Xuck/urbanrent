import { create } from "zustand";

type Auth = {
  user: User | null;
  accessToken: string | null;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
};

export type User = {
  id: string;
  email: string | null
  role: "TENANT" | "LANDLORD" | "ADMIN";
};

export const useAuthStore = create<Auth>((set) => ({
  user: null,
  accessToken: null,
  login:({id, email, role}:User, accessToken)=>{
    set(()=>({user: {id, email, role}, accessToken: accessToken}))
  },
  logout:()=>{
    set(()=>({user: null, accessToken: null}))
  }
}));
