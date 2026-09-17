import type { User } from "../Store/useUserStore";

// ============================================================
// AUTH API
// ============================================================
// These four functions talk to /api/auth.
//
// They deliberately do NOT send an access token. They are how you get a
// session or end one, so there is nothing to send and nothing to refresh.
//
// The refresh token is never handled in JavaScript. The backend puts it in
// an httpOnly cookie, so the browser stores it and attaches it
// automatically. We only have to pass credentials: "include" to allow it.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// What POST /api/auth/login sends back.
export type AuthResponse = {
  message: string;
  user: User;
  accessToken: string;
};

// What POST /api/auth/register sends back.
// NOTE: no accessToken — registering does NOT log you in. Send the person
// to the login page afterwards.
export type RegisterResponse = {
  message: string;
  user: User;
};

// What POST /api/auth/refresh sends back.
// NOTE: no user — just a fresh access token.
export type RefreshResponse = {
  message: string;
  accessToken: string;
};

// ------------------------------------------------------------
// POST /api/auth/login
// ------------------------------------------------------------
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    // Allows the browser to save the httpOnly refresh cookie the backend sets.
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
export async function register(email: string, password: string): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not create your account");
  }

  return data;
}

// ------------------------------------------------------------
// POST /api/auth/refresh
// ------------------------------------------------------------
// Asks for a new access token using the refresh cookie. Throws if the
// cookie is missing, expired, or was revoked.
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

// ------------------------------------------------------------
// POST /api/auth/logout
// ------------------------------------------------------------
// Clears the refresh cookie on the server. This clears the token in the
// database, so it can throw if the session was already dead.
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
