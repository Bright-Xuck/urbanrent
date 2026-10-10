import type { User } from "../Store/useUserStore";
import type { RegistrationRole } from "./types";
import { useAuthStore } from "../Store/useUserStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL;


export type AuthResponse = {
  message: string;
  user: User;
  accessToken: string;
};

export type RegisterResponse = {
  message: string;
  user: User;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const data = await response.json();

  // fetch does NOT throw on 401. We check response.ok ourselves.
  if (!response.ok) {
    throw new Error(data.message || "Could not log you in");
  }

  return data;
}

// ------------------------------------------------------------
// POST /api/auth/register
// ------------------------------------------------------------
export async function register(email: string, password: string, role: RegistrationRole): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not create your account");
  }

  return data;
}

// ------------------------------------------------------------
// POST /api/auth/logout
// ------------------------------------------------------------
// Clears the refresh cookie on the server. This clears the token in the
// database, so it can throw if the session was already dead.
export async function logout(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Could not log you out");
    }
  } finally {
    useAuthStore.getState().logout();
  }
}
