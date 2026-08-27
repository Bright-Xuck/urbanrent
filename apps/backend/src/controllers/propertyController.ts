import type { Request, Response } from "express";
import type { PropertyType } from "../../generated/prisma/enums.js";
import {
  createPropertyForOwner,
  getPropertyById,
  getPublishedProperties,
  getMyProperties,
  updatePropertyForOwner,
  deletePropertyForOwner,
} from "../services/propertyService.js";
import type { PropertyFilters } from "../repositories/propertyRepository.js";

// ============================================================
// PROPERTY CONTROLLER
// ============================================================
// This layer handles HTTP requests/responses.
// It extracts data from the request, calls the service layer,
// and formats the response. It does NOT contain business logic.
//
// IMPORTANT: The `ownerId` always comes from `req.user.userId`,
// which is set by the `authenticate` middleware. It is NEVER
// taken from the request body — that would let a user create
// properties owned by someone else.
// ============================================================

// ============================================================
// CREATE PROPERTY
// ============================================================
// POST /api/properties
// Body: { title, description, propertyType, bedrooms, ... }
// ============================================================
export async function CreateProperty(req: Request, res: Response) {
  // ownerId comes from the authenticated user, not the body
  const ownerId = req.user?.userId;
  if (!ownerId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const {
    title,
    description,
    propertyType,
    bedrooms,
    bathrooms,
    sizeSqm,
    city,
    neighborhood,
    address,
    latitude,
    longitude,
    monthlyRent,
    cautionFee,
    status,
  } = req.body;

  try {
    const property = await createPropertyForOwner(ownerId, {
      title,
      description,
      propertyType,
      bedrooms,
      bathrooms,
      sizeSqm,
      city,
      neighborhood,
      address,
      latitude,
      longitude,
      monthlyRent,
      cautionFee,
      status,
    });

    res.status(201).json({
      message: "Property created successfully",
      property,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// ============================================================
// GET PROPERTIES (public marketplace browse)
// ============================================================
// GET /api/properties
// PUBLIC: no auth required. Returns ONLY published properties across
// all landlords, paginated, so tenants/visitors can browse listings.
// ============================================================
export async function GetProperties(req: Request, res: Response) {
  // Read + validate query params. Defaults: offset 0, 10 per request.
  const offset = Number(req.query.offset) || 0;
  const limit = Number(req.query.limit) || 10;
  if (offset < 0 || limit < 1) {
    res.status(400).json({ message: "offset must be >= 0 and limit must be >= 1" });
    return;
  }

  // Read the optional filter params.
  const { propertyType, city } = req.query;
  const minRent = Number(req.query.minRent) || 0;
  const maxRent = Number(req.query.maxRent) || 0;
  const minBedrooms = Number(req.query.minBedrooms) || 0;

  // Validate: minRent must be <= maxRent when both are present.
  if (minRent > 0 && maxRent > 0 && minRent > maxRent) {
    res.status(400).json({ message: "minRent cannot be greater than maxRent" });
    return;
  }

  // Build the filters object. Only include keys that were actually provided,
  // so an empty query behaves exactly like today.
  const filters: PropertyFilters = {};
  if (propertyType && isPropertyType(propertyType as string)) {
    filters.propertyType = propertyType as PropertyType;
  }
  if (city) filters.city = city as string;
  if (minRent > 0) filters.minRent = minRent;
  if (maxRent > 0) filters.maxRent = maxRent;
  if (minBedrooms > 0) filters.minBedrooms = minBedrooms;

  try {
    const result = await getPublishedProperties(filters, offset, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// Helper: only accept a `propertyType` value that matches a real enum member.
function isPropertyType(value: string): boolean {
  return ["APARTMENT", "STUDIO", "HOUSE", "VILLA", "COMMERCIAL", "OTHER"].includes(value);
}

// ============================================================
// GET MY PROPERTIES (authenticated owner dashboard)
// ============================================================
// GET /api/properties/mine
// LANDLORD/ADMIN only. Returns the caller's OWN properties in ALL
// statuses (drafts included), paginated. ownerId always comes from
// req.user.userId, never from the request.
// ============================================================
export async function GetMyProperties(req: Request, res: Response) {
  const ownerId = req.user?.userId;
  if (!ownerId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  // Read + validate query params. Defaults: offset 0, 10 per request.
  const offset = Number(req.query.offset) || 0;
  const limit = Number(req.query.limit) || 10;
  if (offset < 0 || limit < 1) {
    res.status(400).json({ message: "offset must be >= 0 and limit must be >= 1" });
    return;
  }

  try {
    const result = await getMyProperties(ownerId, offset, limit);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}

// ============================================================
// GET PROPERTY BY ID
// ============================================================
// GET /api/properties/:id
// ============================================================
export async function GetPropertyById(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  try {
    const property = await getPropertyById(id);
    res.status(200).json({ property });
  } catch (error) {
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// ============================================================
// UPDATE PROPERTY
// ============================================================
// PATCH /api/properties/:id
// Only the owner can update. Ownership is checked in the service.
// ============================================================
export async function UpdateProperty(req: Request, res: Response) {
  const ownerId = req.user?.userId;
  if (!ownerId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  const {
    title,
    description,
    propertyType,
    bedrooms,
    bathrooms,
    sizeSqm,
    city,
    neighborhood,
    address,
    latitude,
    longitude,
    monthlyRent,
    cautionFee,
    status,
  } = req.body;

  try {
    const property = await updatePropertyForOwner(id, ownerId, {
      title,
      description,
      propertyType,
      bedrooms,
      bathrooms,
      sizeSqm,
      city,
      neighborhood,
      address,
      latitude,
      longitude,
      monthlyRent,
      cautionFee,
      status,
    });

    res.status(200).json({
      message: "Property updated successfully",
      property,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("permission")) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}

// ============================================================
// DELETE PROPERTY
// ============================================================
// DELETE /api/properties/:id
// Only the owner can delete. Ownership is checked in the service.
// ============================================================
export async function DeleteProperty(req: Request, res: Response) {
  const ownerId = req.user?.userId;
  if (!ownerId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  try {
    await deletePropertyForOwner(id, ownerId);
    res.status(200).json({ message: "Property deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("permission")) {
      res.status(403).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
}