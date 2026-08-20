import type { Request, Response } from "express";
import {
  createPropertyForOwner,
  getPropertyById,
  getPropertiesByOwner,
  updatePropertyForOwner,
  deletePropertyForOwner,
} from "../services/propertyService.js";

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
// GET PROPERTIES (owner's own listings)
// ============================================================
// GET /api/properties
// Returns all properties owned by the authenticated user.
// ============================================================
export async function GetProperties(req: Request, res: Response) {
  const ownerId = req.user?.userId;
  if (!ownerId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const properties = await getPropertiesByOwner(ownerId);
    res.status(200).json({ properties });
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