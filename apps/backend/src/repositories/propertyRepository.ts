import prisma from "../config/prisma.js";
import type { PropertyStatus, PropertyType } from "../../generated/prisma/enums.js";

// ============================================================
// PROPERTY REPOSITORY
// ============================================================
// This file handles ALL database operations related to the Property table.
// It follows the same pattern as userRepository.ts and sessionRepository.ts.
// ============================================================

// The data needed to CREATE a property.
// ownerId comes from the authenticated user, never from the request body.
export interface CreatePropertyInput {
  ownerId: string;
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
}

// The data that can be UPDATED on a property.
// All fields are optional because PATCH allows partial updates.
export interface UpdatePropertyInput {
  title?: string;
  description?: string;
  propertyType?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqm?: number;
  city?: string;
  neighborhood?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  monthlyRent?: number;
  cautionFee?: number;
  status?: PropertyStatus;
}

// ============================================================
// CREATE PROPERTY
// ============================================================
// Inserts a new property row into the properties table.
// ============================================================
export async function createProperty(data: CreatePropertyInput) {
  return prisma.property.create({
    data: {
      ownerId: data.ownerId,
      title: data.title,
      description: data.description ?? null,
      propertyType: data.propertyType,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      sizeSqm: data.sizeSqm ?? null,
      city: data.city,
      neighborhood: data.neighborhood ?? null,
      address: data.address ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      monthlyRent: data.monthlyRent,
      cautionFee: data.cautionFee ?? null,
      status: data.status ?? "DRAFT",
    },
  });
}

// ============================================================
// FIND PROPERTY BY ID
// ============================================================
// Returns a single property, or null if not found.
// ============================================================
export async function findPropertyById(id: string) {
  return prisma.property.findUnique({
    where: { id },
  });
}

// ============================================================
// FIND PROPERTIES BY OWNER
// ============================================================
// Returns all properties owned by a specific user.
// ============================================================
export async function findPropertiesByOwner(ownerId: string, offset: number, limit: number) {
  // Prisma's skip = how many rows to skip (offset), take = how many rows to return (limit).
  // One query fetches the rows for this page, another counts total rows.
  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.property.count({ where: { ownerId } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return { properties, total, offset, limit, totalPages };
}

// The filters the public browse endpoint accepts.
// All optional; an omitted filter is simply not applied.
export interface PropertyFilters {
  propertyType?: PropertyType;
  city?: string;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
}

// ============================================================
// BUILD THE `where` CLAUSE FROM FILTERS
// ============================================================
// Takes the base where (e.g. { status: "PUBLISHED" }) and grows it
// with whatever filters the user supplied. Filters that weren't
// provided are simply left out of the object.
// ============================================================
function applyFilters(
  base: { status: string },
  filters: PropertyFilters
): object {
  const where: Record<string, unknown> = { ...base };

  if (filters.propertyType) where.propertyType = filters.propertyType; // exact match
  if (filters.city) where.city = filters.city; // exact match

  // >= for bedrooms.
  if (filters.minBedrooms) where.bedrooms = { gte: filters.minBedrooms };

  // Rent is a RANGE: minRent and maxRent must collapse into ONE
  // { gte, lte } object. Spr****eading preserves whichever is set first
  // instead of overwriting it.
  let rentRange: { gte?: number; lte?: number } = {};
  if (filters.minRent) rentRange.gte = filters.minRent;
  if (filters.maxRent) rentRange.lte = filters.maxRent;
  if (rentRange.gte !== undefined || rentRange.lte !== undefined) {
    where.monthlyRent = rentRange;
  }

  return where;
}

// ============================================================
// FIND PUBLISHED PROPERTIES (public marketplace browse)
// ============================================================
// Returns ONLY PUBLISHED properties, across all landlords, paginated
// and FILTERED. Used by the public GET /api/properties endpoint so
// any visitor can browse listings without logging in.
//
// CRITICAL: the SAME `where` object is used for BOTH the page query
// and the count query, so totalPages always reflects the visible
// (filtered) results.
// ============================================================
export async function findPublishedProperties(
  filters: PropertyFilters,
  offset: number,
  limit: number
) {
  const where = applyFilters({ status: "PUBLISHED" as const }, filters);

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return { properties, total, offset, limit, totalPages };
}

// ============================================================
// UPDATE PROPERTY
// ============================================================
// Updates a property. Only the fields provided in `data` are changed.
// ============================================================
export async function updateProperty(id: string, data: UpdatePropertyInput) {
  // Build the update object dynamically, only including fields
  // that were actually provided. This is required because of the
  // `exactOptionalPropertyTypes` setting — we can't pass `undefined`
  // to Prisma's update data.
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.propertyType !== undefined) updateData.propertyType = data.propertyType;
  if (data.bedrooms !== undefined) updateData.bedrooms = data.bedrooms;
  if (data.bathrooms !== undefined) updateData.bathrooms = data.bathrooms;
  if (data.sizeSqm !== undefined) updateData.sizeSqm = data.sizeSqm;
  if (data.city !== undefined) updateData.city = data.city;
  if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;
  if (data.address !== undefined) updateData.address = data.address;
  if (data.latitude !== undefined) updateData.latitude = data.latitude;
  if (data.longitude !== undefined) updateData.longitude = data.longitude;
  if (data.monthlyRent !== undefined) updateData.monthlyRent = data.monthlyRent;
  if (data.cautionFee !== undefined) updateData.cautionFee = data.cautionFee;
  if (data.status !== undefined) updateData.status = data.status;

  return prisma.property.update({
    where: { id },
    data: updateData,
  });
}

// ============================================================
// DELETE PROPERTY
// ============================================================
// Deletes a property row from the table.
// ============================================================
export async function deleteProperty(id: string) {
  return prisma.property.delete({
    where: { id },
  });
}