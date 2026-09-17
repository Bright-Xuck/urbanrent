import { useAuthStore } from "../Store/useUserStore";
import type { Amenity, PropertyAmenityLink } from "./types";

// ============================================================
// AMENITY API
// ============================================================
// The backend mounts amenity routes under a property:
//   GET    /api/properties/:propid
//   POST   /api/properties/:propid
//   DELETE /api/properties/:propid/:id
//
// WARNING: the GET below does not actually work right now. It is a backend
// problem, not a frontend one. Two separate issues:
//
//   1. The amenity router is mounted on /api/properties/:propid in app.ts,
//      but AFTER propertyRoutes, which already handles GET /:id. So a
//      request to GET /api/properties/<id> is answered by the property
//      controller first and never reaches the amenity router. That is why
//      the GET below gets a Property object back instead of a list.
//      Fix: give the router its own sub-path (/amenities, /amenities/:id).
//
//   2. The amenity router has no `authenticate` middleware, so anybody can
//      create or delete an amenity. It needs one, plus a check that you
//      own the property.
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ------------------------------------------------------------
// LIST — GET /api/properties/:propid
// ------------------------------------------------------------
export async function getPropertyAmenities(propertyId: string): Promise<Amenity[]> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${propertyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load the amenities");
  }

  // This endpoint is supposed to send an array. It currently sends a single
  // Property object because of problem 1 above. Checking here stops a
  // broken response from quietly breaking the page that called us.
  if (!Array.isArray(data)) {
    throw new Error(
      "Got a Property back instead of a list of amenities. The backend amenity route needs fixing."
    );
  }

  return data;
}

// ------------------------------------------------------------
// CREATE + LINK — POST /api/properties/:propid
// ------------------------------------------------------------
// The body field is spelled `pictureurl`, all lowercase — that is the
// exact name the controller looks for.
export async function createAmenity(
  propertyId: string,
  name: string,
  pictureurl?: string
): Promise<{ amenity: Amenity; link: PropertyAmenityLink }> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${propertyId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(pictureurl ? { name, pictureurl } : { name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not create the amenity");
  }

  // The backend calls the new row `amenities`, which is confusing. Rename
  // it here so callers get a clear singular name.
  return { amenity: data.amenities, link: data.link };
}

// ------------------------------------------------------------
// DELETE — DELETE /api/properties/:propid/:id
// ------------------------------------------------------------
// `amenityId` is the AMENITY id. The property id is only in the URL
// because that is where the router is mounted; the controller ignores it.
export async function deleteAmenity(
  propertyId: string,
  amenityId: string
): Promise<Amenity> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${propertyId}/${amenityId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not delete the amenity");
  }

  return data.deletedRes;
}
