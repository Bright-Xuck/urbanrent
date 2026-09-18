import { useAuthStore } from "../Store/useUserStore";
import type { Amenity, PropertyAmenityLink, PropertyAmenityRow } from "./types";

// ============================================================
// AMENITY API
// ============================================================
// The backend mounts amenity routes under a property, on an explicit
// /amenities sub-path:
//   GET    /api/properties/:propid/amenities
//   POST   /api/properties/:propid/amenities
//   DELETE /api/properties/:propid/amenities/:id
//
// The sub-path matters: mounted on / they would collide with the property
// router's GET /:id, which would answer first and never hand the request on.
//
// All three routes require a token, and POST/DELETE additionally require you
// to own the property (or be an ADMIN).
//
// SHAPE: the LIST returns PropertyAmenity JOIN rows with the amenity nested,
// i.e. [{ id, propertyId, amenityId, createdAt, amenity: { … } }] — not a
// plain Amenity[]. See PropertyAmenityRow in types.ts. Two things follow:
//   - a name is at `row.amenity.name`, not `row.name`
//   - DELETE wants the AMENITY id (`row.amenity.id`); `row.id` is the link
//     row's own id
// ============================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ------------------------------------------------------------
// LIST — GET /api/properties/:propid
// ------------------------------------------------------------
export async function getPropertyAmenities(
  propertyId: string
): Promise<PropertyAmenityRow[]> {
  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${API_URL}/properties/${propertyId}/amenities`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load the amenities");
  }

  // Defensive: the route is supposed to send an array of join rows. If the
  // shape ever changes, fail loudly here instead of rendering blank chips.
  if (!Array.isArray(data)) {
    throw new Error("Expected a list of amenities from the server.");
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

  const response = await fetch(`${API_URL}/properties/${propertyId}/amenities`, {
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

  const response = await fetch(`${API_URL}/properties/${propertyId}/amenities/${amenityId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not delete the amenity");
  }

  return data.deletedRes;
}
