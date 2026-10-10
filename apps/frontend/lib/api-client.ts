"use client";

import type { Role } from "../api/types";
import { useAuthStore, type User } from "../Store/useUserStore";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<string> | null = null;

function apiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

async function responseMessage(response: Response): Promise<string | null> {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
    ) {
      return body.message;
    }
  } catch {
    return null;
  }

  return null;
}

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

async function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = refreshSession().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function refreshSession(): Promise<string> {
  const previousToken = useAuthStore.getState().accessToken;
  const response = await fetch(apiUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = new ApiError(
      (await responseMessage(response)) ?? "Could not refresh your session.",
      response.status
    );
    if (
      (response.status === 400 || response.status === 401) &&
      useAuthStore.getState().accessToken === previousToken
    ) {
      useAuthStore.getState().logout();
    }
    throw error;
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    !("accessToken" in body) ||
    typeof body.accessToken !== "string"
  ) {
    throw new Error("The authentication service returned an invalid session.");
  }

  const accessToken = body.accessToken;
  const user = readUserFromAccessToken(accessToken);
  if (!user) {
    if (useAuthStore.getState().accessToken === previousToken) {
      useAuthStore.getState().logout();
    }
    throw new Error("The authentication service returned an invalid access token.");
  }

  const currentToken = useAuthStore.getState().accessToken;
  if (currentToken !== previousToken) {
    if (currentToken) return currentToken;
    throw new Error("The session changed while it was being refreshed.");
  }

  useAuthStore.getState().login(user, accessToken);
  return accessToken;
}

async function send(
  path: string,
  options: RequestInit,
  accessToken: string | null
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.delete("Authorization");
  if (accessToken) headers.set("Authorization", ["Bearer", accessToken].join(" "));

  return fetch(apiUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const response = await send(path, options, token);
  if (response.status !== 401) return response;

  const refreshedToken = await refreshAccessToken();
  const retry = await send(path, options, refreshedToken);

  if (
    retry.status === 401 &&
    useAuthStore.getState().accessToken === refreshedToken
  ) {
    useAuthStore.getState().logout();
  }

  return retry;
}

export async function restoreSession(): Promise<void> {
  try {
    if (!useAuthStore.getState().accessToken) {
      await refreshAccessToken();
    }
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 400 || error.status === 401))) {
      console.error("Could not restore the UrbanRent session.", error);
    }
  } finally {
    useAuthStore.getState().finishInitialization();
  }
}
