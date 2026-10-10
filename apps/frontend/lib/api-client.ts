"use client";

import { useAuthStore } from "../Store/useUserStore";
import { readUserFromAccessToken } from "../features/auth/token";

type ApiFetchOptions = RequestInit & {
  auth?: "optional" | "none";
  skipRefresh?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let refreshInFlight: Promise<string> | null = null;

function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}/${path.replace(/^\/+/, "")}`;
}

function createHeaders(
  headers: HeadersInit | undefined,
  auth: ApiFetchOptions["auth"],
  accessToken: string | null
): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.delete("Authorization");

  if (auth !== "none" && accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return requestHeaders;
}

async function readMessage(response: Response): Promise<string | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    const body: unknown = JSON.parse(text);
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

async function performRefresh(): Promise<string> {
  const previousToken = useAuthStore.getState().accessToken;
  let response: Response;

  try {
    response = await fetch(apiUrl("/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    throw new Error("Could not reach the authentication service.", {
      cause: error,
    });
  }

  if (!response.ok) {
    const message = await readMessage(response);
    const error = new ApiError(
      message ?? "Could not refresh your session.",
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

function refreshAccessToken(): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

async function send(
  url: string,
  options: ApiFetchOptions,
  accessToken: string | null
): Promise<Response> {
  const { auth = "optional", skipRefresh: _skipRefresh, ...init } = options;
  return fetch(url, {
    ...init,
    headers: createHeaders(init.headers, auth, accessToken),
    credentials: "include",
  });
}

export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const url = apiUrl(path);
  const initialToken = useAuthStore.getState().accessToken;
  const response = await send(url, options, initialToken);

  if (response.status !== 401 || options.skipRefresh) {
    return response;
  }

  const refreshedToken = await refreshAccessToken();
  const retriedResponse = await send(url, options, refreshedToken);

  if (
    retriedResponse.status === 401 &&
    useAuthStore.getState().accessToken === refreshedToken
  ) {
    useAuthStore.getState().logout();
  }

  return retriedResponse;
}

export async function restoreSession(): Promise<void> {
  const auth = useAuthStore.getState();
  if (auth.accessToken) {
    auth.setSessionStatus("authenticated");
    return;
  }

  auth.setSessionStatus("checking");

  try {
    await refreshAccessToken();
  } catch (error) {
    if (useAuthStore.getState().accessToken) {
      useAuthStore.getState().setSessionStatus("authenticated");
      return;
    }

    if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
      useAuthStore.getState().setSessionStatus("anonymous");
      return;
    }

    useAuthStore.getState().setSessionStatus("error");
  }
}
