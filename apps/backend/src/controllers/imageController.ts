import type { Request, Response } from "express";
import {
  uploadPropertyImages,
  getImagesForProperty,
} from "../services/imageService.js";


export async function UploadPropertyImages(req: Request, res: Response) {
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

  // multer (with .array('images', N)) puts the files here.
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files || files.length === 0) {
    res.status(400).json({ message: "No images were uploaded" });
    return;
  }

  try {
    await uploadPropertyImages(id, ownerId, files);
    res.status(201).json({
      message: `${files.length} image(s) uploaded successfully`,
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

// ------------------------------------------------------------
// GET IMAGES FOR A PROPERTY
// ------------------------------------------------------------
// GET /api/properties/:id/images
// ------------------------------------------------------------
export async function GetPropertyImages(req: Request, res: Response) {
  const { id } = req.params;
  if (typeof id !== "string") {
    res.status(400).json({ message: "Invalid property id" });
    return;
  }

  try {
    const images = await getImagesForProperty(id);
    res.status(200).json({ images });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
}