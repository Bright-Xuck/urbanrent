import type { User } from "../Store/useUserStore";
import { useAuthStore } from "../Store/useUserStore";
import type { Role } from "./types";
import type { RegistrationRole } from "./types";

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

export function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type RefreshResponse = {
  message: string;
  accessToken: string;
};

function isRole(value: unknown): value is Role {
  return value === "TENANT" || value === "LANDLORD" || value === "ADMIN";
}

function readUserFromAccessToken(token: string): User | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const claims: unknown = JSON.parse(atob(padded));
    if (typeof claims !== "object" || claims === null) return null;

    const id = "userId" in claims ? claims.userId : undefined;
    const email = "email" in claims ? claims.email : undefined;
    const role = "role" in claims ? claims.role : undefined;
    if (typeof id !== "string" || !isRole(role)) return null;

    return { id, email: typeof email === "string" ? email : null, role };
  } catch {
    return null;
  }
}

export async function refreshSession(): Promise<void> {
  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) return;
    throw new Error(data.message || "Could not restore your session");
  }

  const body: RefreshResponse = data;
  const user = readUserFromAccessToken(body.accessToken);
  if (!user) throw new Error("The authentication service returned an invalid token.");

  useAuthStore.getState().login(user, body.accessToken);
}

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
