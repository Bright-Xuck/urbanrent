import type { User } from "../Store/useUserStore";

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

export type RefreshResponse = {
  message: string;
  accessToken: string;
};

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not log you in");
  }

  return data;
}

export async function register(
  email: string,
  password: string,
  role: "TENANT" | "LANDLORD"
): Promise<RegisterResponse> {
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

export async function refreshSession(): Promise<RefreshResponse> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not refresh your session");
  }

  return data;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Could not log you out");
  }
}
