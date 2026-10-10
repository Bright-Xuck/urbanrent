import { apiFetch as fetch } from "../lib/api-client";
import { readApiJson } from "../lib/api-response";
import type {
  PaginatedProperties,
  Property,
  PropertyImage,
  PropertyStatus,
  PropertyType,
} from "./types";

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
  const response = await fetch(`/properties${buildQuery(filters, pagination)}`);

  const data = await readApiJson<PaginatedProperties>(response, "Listings service");

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
  const query = buildQuery({}, pagination);

  const response = await fetch(`/properties/mine${query}`);

  const data = await readApiJson<PaginatedProperties>(response, "Listings service");

  if (!response.ok) {
    throw new Error(data.message || "Could not load your properties");
  }

  return data;
}

// ------------------------------------------------------------
// SINGLE — GET /api/properties/:id
// ------------------------------------------------------------
// Owners can also read their own unpublished listings.
export async function getPropertyById(id: string): Promise<Property> {
  const response = await fetch(`/properties/${id}`);

  const data = await readApiJson<{ property: Property }>(
    response,
    "Listings service"
  );

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
  const response = await fetch(`/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await readApiJson<{ property: Property }>(
    response,
    "Listings service"
  );

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
  const response = await fetch(`/properties/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await readApiJson<{ property: Property }>(
    response,
    "Listings service"
  );

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
  const response = await fetch(`/properties/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const data = await readApiJson<Record<string, unknown>>(
      response,
      "Listings service"
    );
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
  const formData = new FormData();

  for (const image of images) {
    formData.append("images", image);
  }

  const response = await fetch(`/properties/${id}/images`, {
    method: "POST",
    body: formData,
  });

  const data = await readApiJson<{ message: string }>(
    response,
    "Listings service"
  );

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
  const response = await fetch(`/properties/${id}/images`);

  const data = await readApiJson<{ images: PropertyImage[] }>(
    response,
    "Listings service"
  );

  if (!response.ok) {
    throw new Error(data.message || "Could not load the images");
  }

  // The backend wraps it: { images }
  return data.images;
}
