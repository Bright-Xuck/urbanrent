import { useAuthStore } from "../Store/useUserStore";
import type {
  AccountState,
  AdminUser,
  PaginatedUsers,
  Role,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Same defensive body reader as propertyApi: the backend always sends
// JSON, but a proxy error page must not crash the parse.
async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return { message: `Admin service unavailable (${response.status})` };
  }
}

function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The query options GET /api/admin/users understands.
export type AdminUserFilters = {
  role?: Role;
  accountState?: AccountState;
};

// The backend uses offset 0 and limit 10 when these are left out.
export type Pagination = {
  offset?: number;
  limit?: number;
};

function buildQuery(filters: AdminUserFilters, pagination: Pagination): string {
  const params = new URLSearchParams();

  if (filters.role) params.set("role", filters.role);
  if (filters.accountState) params.set("accountState", filters.accountState);
  if (pagination.offset !== undefined) params.set("offset", String(pagination.offset));
  if (pagination.limit !== undefined) params.set("limit", String(pagination.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

// ------------------------------------------------------------
// LIST — GET /api/admin/users
// ------------------------------------------------------------
// ADMIN only: the backend answers 403 for anyone else, which we throw
// as a normal Error so the page can show it in an Alert.
export async function getUsers(
  filters: AdminUserFilters = {},
  pagination: Pagination = {}
): Promise<PaginatedUsers> {
  const response = await fetch(
    `${API_URL}/admin/users${buildQuery(filters, pagination)}`,
    { headers: authHeaders() }
  );

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not load users");
  }

  return data;
}

// ------------------------------------------------------------
// SUSPEND — PATCH /api/admin/users/:id/suspend
// ------------------------------------------------------------
// For a LANDLORD this also flips their PUBLISHED listings to
// UNPUBLISHED — one transaction on the backend.
export async function suspendUser(id: string): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/admin/users/${id}/suspend`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not suspend this user");
  }

  return data.user;
}

// ------------------------------------------------------------
// REINSTATE — PATCH /api/admin/users/:id/reinstate
// ------------------------------------------------------------
// Only the account state flips; listings stay UNPUBLISHED (the landlord
// republishes them manually).
export async function reinstateUser(id: string): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/admin/users/${id}/reinstate`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not reinstate this user");
  }

  return data.user;
}
