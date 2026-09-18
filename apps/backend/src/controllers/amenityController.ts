import type { Request, Response } from "express";
import {
  getAmenitybyProperty,
  PostAmenityNormal,
  DeleteAmenityRoute,
  AmenityToProperty,
  assertCanManageAmenities,
} from "../services/amenityService.js";

// ============================================================
// AMENITY CONTROLLER
// ============================================================
// Mounted under /api/properties/:propid/amenities.
//
// Reading a property's amenities only needs a valid token (any signed-in
// user may read a listing). Adding or removing one is an owner action, so
// those two handlers first run the same ownership check property
// update/delete use: LANDLORD who owns the property, or an ADMIN.
// ============================================================

export async function getAmenities(req: Request, res: Response) {
  const { propid } = req.params;
  if (typeof propid !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }
  try {
    const amenities = await getAmenitybyProperty(propid);
    res.status(200).json(amenities);
  } catch (error) {
    res.status(500).json({ message: "Failed to get amenity for this property" });
  }
}

export async function postAmenity(req: Request, res: Response) {
  const { propid } = req.params;
  const { name, pictureurl } = req.body;

  if (typeof name !== "string" || name.trim() === "" || typeof propid !== "string") {
    res.status(400).json({ message: "Invalid amenity name and picture" });
    return;
  }

  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId || !role) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    // Owner (or admin) only — this is what stops anyone adding amenities to
    // a property they don't own.
    await assertCanManageAmenities(propid, userId, role);

    const amenities = await PostAmenityNormal(name, pictureurl);
    const link = await AmenityToProperty(amenities.id, propid);
    res.status(201).json({ message: "Amenity created succesfully", amenities, link });
  } catch (error) {
    if (error instanceof Error && error.message === "Property not found") {
      res.status(404).json({ message: error.message });
      return;
    }
    if (error instanceof Error && error.message.includes("permission")) {
      res.status(403).json({ message: error.message });
      return;
    }
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deletebyId(req: Request, res: Response) {
  const { propid, id } = req.params;

  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid amenity id" });
    return;
  }
  if (typeof propid !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId || !role) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    await assertCanManageAmenities(propid, userId, role);

    const deletedRes = await DeleteAmenityRoute(id);
    res.status(200).json({ message: "successfully deleted amenity", deletedRes });
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
