import { create } from "zustand";

type Auth = {
  user: User | null;
  accessToken: string | null;
  login: (user: User, accessToken:string) => void;
  logout: () => void;
};

export type User = {
  id: "TENANT" | "LANDLORD" | "ADMIN" | null
  email: string | null
  role: string | null;
};

export const useAuthStore = create<Auth>((set) => ({
  user: { id: null, email: null, role: null },
  accessToken: null,
  login:({id, email, role}:User, accessToken)=>{
    set(()=>({user: {id, email, role}, accessToken: accessToken}))
  },
  logout:()=>{
    set(()=>({user: null, accessToken: null}))
  }
}));
