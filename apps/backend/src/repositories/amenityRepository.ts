import prisma from "../config/prisma.js";

// ============================================================
// AMENITY REPOSITORY
// ============================================================
// This file handles ALL database operations related to the Amenity table.
// It follows the same pattern as propertyRepository.ts.
//
// IMPORTANT: Amenities are tied to a PROPERTY via the PropertyAmenity
// linking table. So this repository has TWO kinds of operations:
//   1. CRUD on the Amenity table itself (create/find/update/delete amenity)
//   2. Linking operations on the PropertyAmenity table (link/unlink)
// ============================================================

// The data needed to CREATE an amenity.
export interface CreateAmenityInput {
  name: string;
  picture?: string;
}

// The data that can be UPDATED on an amenity.
export interface UpdateAmenityInput {
  name?: string;
  picture?: string;
}

// ============================================================
// CREATE AMENITY
// ============================================================
// Inserts a new amenity row into the amenities table.
// ============================================================
export async function createAmenity(data: CreateAmenityInput) {
  return prisma.amenity.create({
    data: {
      name: data.name,
      picture: data.picture ?? null,
    },
  });
}

// ============================================================
// FIND ALL AMENITIES
// ============================================================
// Returns all amenities in the catalog.
// ============================================================
export async function findAllAmenities() {
  return prisma.amenity.findMany({
    orderBy: { name: "asc" },
  });
}

// ============================================================
// FIND AMENITY BY ID
// ============================================================
// Returns a single amenity, or null if not found.
// ============================================================
export async function findAmenityById(id: string) {
  return prisma.amenity.findUnique({
    where: { id },
  });
}

// ============================================================
// FIND AMENITY BY NAME
// ============================================================
// Used to check if an amenity name already exists (it's @unique).
// ============================================================
export async function findAmenityByName(name: string) {
  return prisma.amenity.findUnique({
    where: { name },
  });
}

// ============================================================
// UPDATE AMENITY
// ============================================================
// Updates an amenity. Only the fields provided are changed.
// ============================================================
export async function updateAmenity(id: string, data: UpdateAmenityInput) {
  // Build the update object dynamically (same as propertyRepository)
  // because of the `exactOptionalPropertyTypes` setting.
  const updateData: Record<string, unknown> = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.picture !== undefined) updateData.picture = data.picture;

  return prisma.amenity.update({
    where: { id },
    data: updateData,
  });
}

// ============================================================
// DELETE AMENITY
// ============================================================
// Deletes an amenity. Because of onDelete: Cascade on the
// PropertyAmenity table, all links to this amenity are removed too.
// ============================================================
export async function deleteAmenity(id: string) {
  return prisma.amenity.delete({
    where: { id },
  });
}

// ============================================================
// LINK AMENITY TO PROPERTY
// ============================================================
// Creates a row in the PropertyAmenity linking table.
// This is how we attach an amenity to a specific property.
// ============================================================
export async function linkAmenityToProperty(amenityId: string, propertyId: string) {
  return prisma.propertyAmenity.create({
    data: {
      propertyId,
      amenityId,
    },
  });
}

// ============================================================
// FIND AMENITIES BY PROPERTY
// ============================================================
// Returns all amenities linked to a specific property.
// We query the PropertyAmenity table and include the amenity data.
// ============================================================
export async function findAmenitiesByProperty(propertyId: string) {
  return prisma.propertyAmenity.findMany({
    where: { propertyId },
    include: { amenity: true },
  });
}