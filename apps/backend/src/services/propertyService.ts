import {
  createProperty,
  findPropertyById,
  findPropertiesByOwner,
  updateProperty,
  deleteProperty,
  type CreatePropertyInput,
  type UpdatePropertyInput,
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
// GET PROPERTIES BY OWNER
// ------------------------------------------------------------
// Returns all properties owned by a specific user.
// ------------------------------------------------------------
export async function getPropertiesByOwner(ownerId: string) {
  return findPropertiesByOwner(ownerId);
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