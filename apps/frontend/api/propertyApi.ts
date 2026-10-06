import { useAuthStore } from "../Store/useUserStore";
import type {
  PaginatedProperties,
  Property,
  PropertyImage,
  PropertyStatus,
  PropertyType,
} from "./types";



const API_URL = process.env.NEXT_PUBLIC_API_URL;


async function readJson(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, any>;
  } catch {
    return { message: `Listings service unavailable (${response.status})` };
  }
}

// ------------------------------------------------------------
// AUTH HEADERS
// ------------------------------------------------------------
// The Authorization header for a signed-in caller, or an empty object for a
// guest. This module's public routes (GET /properties/:id and its images)
// accept either: with no header a visitor reads the published listing, and
// with a token the backend can also recognise the OWNER (so they still see
// their own draft). Note we send NO header when logged out — never a
// literal `Bearer null`.
function authHeaders(): Record<string, string> {
  const token = useAuthStore.getState().accessToken;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// The query options GET /api/properties understands.
export type PropertyFilters = {
  propertyType?: PropertyType;
  city?: string;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
};

// The backend uses offset 0 and limit 10 when these are left out.
export type Pagination = {
  offset?: number;
  limit?: number;
};

// What POST /api/properties needs. There is no ownerId here on purpose —
// the backend takes the owner from your access token.
export type CreatePropertyInput = {
  title: string;
  description?: string;
  propertyType: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  city: string;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  monthlyRent: number;
  cautionFee?: number;
  status?: PropertyStatus;
};

// PATCH accepts any subset of the create fields.
export type UpdatePropertyInput = Partial<CreatePropertyInput>;

// Turns the filters into "?city=Lagos&limit=10".
// Only adds the ones that were actually given, so the URL stays clean.
function buildQuery(filters: PropertyFilters, pagination: Pagination): string {
  const params = new URLSearchParams();

  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.city) params.set("city", filters.city);
  if (filters.minRent !== undefined) params.set("minRent", String(filters.minRent));
  if (filters.maxRent !== undefined) params.set("maxRent", String(filters.maxRent));
  if (filters.minBedrooms !== undefined) {
    params.set("minBedrooms", String(filters.minBedrooms));
  }
  if (pagination.offset !== undefined) params.set("offset", String(pagination.offset));
  if (pagination.limit !== undefined) params.set("limit", String(pagination.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

// ------------------------------------------------------------
// BROWSE — GET /api/properties (public)
// ------------------------------------------------------------
// Anyone can call this, logged in or not. The backend only returns
// properties whose status is PUBLISHED.
export async function getProperties(
  filters: PropertyFilters = {},
  pagination: Pagination = {}
): Promise<PaginatedProperties> {
  const response = await fetch(`${API_URL}/properties${buildQuery(filters, pagination)}`);

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not load properties");
  }

  return data;
}

// ------------------------------------------------------------
// MY LISTINGS — GET /api/properties/mine

export async function getMyProperties(
  pagination: Pagination = {}
): Promise<PaginatedProperties> {
  // The token we saved when the user logged in.
  const token = useAuthStore.getState().accessToken;

  const query = buildQuery({}, pagination);

  const response = await fetch(`${API_URL}/properties/mine${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not load your properties");
  }

  return data;
}

// ------------------------------------------------------------
// SINGLE — GET /api/properties/:id
// ------------------------------------------------------------
// Public: a logged-out visitor can read a published listing. The token is
// sent when we have one, because the backend uses it to tell whether the
// caller is the OWNER (who may also view their own draft/unpublished
// listing) or just another visitor.
export async function getPropertyById(id: string): Promise<Property> {
  const response = await fetch(`${API_URL}/properties/${id}`, {
    headers: authHeaders(),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not load this property");
  }

  // The backend wraps it: { message, property }
  return data.property;
}

// ------------------------------------------------------------
// CREATE — POST /api/properties (landlord only)
// ------------------------------------------------------------
export async function createProperty(input: CreatePropertyInput): Promise<Property> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not create the property");
  }

  return data.property;
}

// ------------------------------------------------------------
// UPDATE — PATCH /api/properties/:id (owner only)
// ------------------------------------------------------------
export async function updateProperty(
  id: string,
  input: UpdatePropertyInput
): Promise<Property> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not update the property");
  }

  return data.property;
}

// ------------------------------------------------------------
// PUBLISH / UNPUBLISH / ARCHIVE — PATCH /api/properties/:id
// ------------------------------------------------------------
// There is NO separate publish endpoint on the backend, and there is
// no need for one: `status` is just another column, so publishing is an
// ordinary update. All three helpers below go through updateProperty,
// which sends PATCH /api/properties/:id with { status: ... }.
//
// The backend checks that you own the property before changing it.
export function publishProperty(id: string): Promise<Property> {
  return updateProperty(id, { status: "PUBLISHED" });
}

export function unpublishProperty(id: string): Promise<Property> {
  return updateProperty(id, { status: "UNPUBLISHED" });
}

// The dashboard's "Archive" action. Same route, different status value.
export function archiveProperty(id: string): Promise<Property> {
  return updateProperty(id, { status: "ARCHIVED" });
}

// ------------------------------------------------------------
// DELETE — DELETE /api/properties/:id (owner only)
// ------------------------------------------------------------
export async function deleteProperty(id: string): Promise<void> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const data = await readJson(response);
    throw new Error(data.message || "Could not delete the property");
  }
}

// ------------------------------------------------------------
// IMAGES — POST /api/properties/:id/images
// ------------------------------------------------------------
// Maximum 5 files per request. The body must be FormData, and we must NOT
// set a Content-Type header: the browser sets multipart/form-data itself,
// because the value has to include a boundary string.
export async function uploadPropertyImages(id: string, images: File[]): Promise<string> {
  const token = useAuthStore.getState().accessToken;

  const formData = new FormData();

  for (const image of images) {
    formData.append("images", image);
  }

  const response = await fetch(`${API_URL}/properties/${id}/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not upload the images");
  }

  return data.message;
}

// ------------------------------------------------------------
// IMAGES — GET /api/properties/:id/images
// ------------------------------------------------------------
// Public, same as the listing itself — see getPropertyById above.
export async function getPropertyImages(id: string): Promise<PropertyImage[]> {
  const response = await fetch(`${API_URL}/properties/${id}/images`, {
    headers: authHeaders(),
  });

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(data.message || "Could not load the images");
  }

  // The backend wraps it: { images }
  return data.images;
}
