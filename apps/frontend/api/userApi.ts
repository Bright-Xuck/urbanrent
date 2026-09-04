import type { User } from "../Store/useUserStore";


type AuthResponse = {
  message: string;
  user: User;
  accessToken: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function login(email:string, password:string){
    //const response = await fetch()
}