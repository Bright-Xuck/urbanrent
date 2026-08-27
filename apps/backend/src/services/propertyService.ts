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
  return createProperty({ ...data, ownerId });
}

// ------------------------------------------------------------
// GET PROPERTY BY ID
// ------------------------------------------------------------
// Returns a single property, or throws if not found.
// ------------------------------------------------------------
export async function getPropertyById(id: string) {
  const property = await findPropertyById(id);
  if (!property) throw new Error("Property not found");
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

  // 3. Perform the update
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