import {
  createProperty,
  findPropertyById,
  findPropertiesByOwner,
  findPublishedProperties,
  updateProperty,
  deleteProperty,
  type CreatePropertyInput,
  type UpdatePropertyInput,
  type PropertyFilters,
} from "../repositories/propertyRepository.js";
import { requireVerifiedOwner } from "./verificationService.js";

// ============================================================
// PROPERTY SERVICE - Business Logic Layer
// ============================================================
// This is where we decide WHAT to do. The repositories handle
// HOW to talk to the DB. The controllers handle HTTP.
//
// The key business rule here is OWNERSHIP:
//   - A user can only create properties they own
//   - A user can only update/delete their OWN properties
// This is authorization, layered on top of authentication.
// ============================================================

// ------------------------------------------------------------
// CREATE PROPERTY
// ------------------------------------------------------------
// ownerId comes from the authenticated user (req.user.userId),
// never from the request body. This prevents a user from
// creating a property owned by someone else.
// ------------------------------------------------------------
export async function createPropertyForOwner(ownerId: string, data: Omit<CreatePropertyInput, "ownerId">) {
  // A listing can only be BORN published if its owner is verified.
  // (The new-listing page's "Publish listing" button POSTs with
  // status PUBLISHED, so this path needs the same gate as updates.)
  if (data.status === "PUBLISHED") {
    await requireVerifiedOwner(ownerId);
  }
  return createProperty({ ...data, ownerId });
}

// ------------------------------------------------------------
// GET PROPERTY BY ID
// ------------------------------------------------------------
// Returns a single property, or throws if not found.
//
// `viewer` is whoever is asking, when the route could identify them
// (the route uses `optionalAuthenticate`, so it is null for a guest).
// It is null/omitted for logged-out visitors.
//
// VISIBILITY RULE: a listing is readable by anyone while it is
// PUBLISHED — that is the marketplace. DRAFT / UNPUBLISHED / ARCHIVED
// rows are private to the landlord who owns them (and to an ADMIN),
// so a draft id in a URL cannot be read by strangers. Without this
// check the public detail route leaked unpublished listings.
export async function getPropertyById(
  id: string,
  viewer?: { userId: string; role: string } | null
) {
  const property = await findPropertyById(id);
  if (!property) throw new Error("Property not found");

  const isOwner = viewer?.userId === property.ownerId;
  const isAdmin = viewer?.role === "ADMIN";

  if (property.status !== "PUBLISHED" && !isOwner && !isAdmin) {
    // Same message as a row that does not exist, so a guest cannot use
    // the error to discover which ids are real-but-hidden listings.
    throw new Error("Property not found");
  }

  return property;
}

// ------------------------------------------------------------
// GET MY PROPERTIES (landlord/owner dashboard)
// ------------------------------------------------------------
// Returns the authenticated user's OWN properties, in ALL statuses
// (drafts included), paginated. Only the owner ever calls this.
// ------------------------------------------------------------
export async function getMyProperties(ownerId: string, offset: number, limit: number) {
  return findPropertiesByOwner(ownerId, offset, limit);
}

// ------------------------------------------------------------
// GET PUBLISHED PROPERTIES (public marketplace browse)
// ------------------------------------------------------------
// Returns ONLY published properties across all landlords, paginated
// and filtered. This is the public browse used on `GET /api/properties`,
// open to any visitor.
// ------------------------------------------------------------
export async function getPublishedProperties(
  filters: PropertyFilters,
  offset: number,
  limit: number
) {
  return findPublishedProperties(filters, offset, limit);
}

// ------------------------------------------------------------
// UPDATE PROPERTY
// ------------------------------------------------------------
// Only the OWNER can update a property. We check that the
// property exists AND that its ownerId matches the requesting user.
// ------------------------------------------------------------
export async function updatePropertyForOwner(id: string, ownerId: string, data: UpdatePropertyInput) {
  // 1. Load the property to check ownership
  const property = await findPropertyById(id);
  if (!property) throw new Error("Property not found");

  // 2. Authorization check: only the owner can update
  if (property.ownerId !== ownerId) {
    throw new Error("You do not have permission to update this property");
  }

  // 3. Gate: only a VERIFIED owner may move a listing TO published.
  // Drafts, unpublishing, archiving, and ordinary edits never touch it.
  if (data.status === "PUBLISHED" && property.status !== "PUBLISHED") {
    await requireVerifiedOwner(ownerId);
  }

  // 4. Perform the update
  return updateProperty(id, data);
}

// ------------------------------------------------------------
// DELETE PROPERTY
// ------------------------------------------------------------
// Only the OWNER can delete a property. Same ownership check.
// ------------------------------------------------------------
export async function deletePropertyForOwner(id: string, ownerId: string) {
  // 1. Load the property to check ownership
  const property = await findPropertyById(id);
  if (!property) throw new Error("Property not found");

  // 2. Authorization check: only the owner can delete
  if (property.ownerId !== ownerId) {
    throw new Error("You do not have permission to delete this property");
  }

  // 3. Perform the delete
  return deleteProperty(id);
}