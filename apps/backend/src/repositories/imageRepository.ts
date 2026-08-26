import prisma from "../config/prisma.js";

// ============================================================
// IMAGE REPOSITORY
// ============================================================
// Handles all database operations for the PropertyImage table.
// The `url` is the public Supabase URL. The `publicId` is the
// object path inside the bucket (so we can delete it later).
// ============================================================

// ------------------------------------------------------------
// SAVE MANY IMAGES FOR A PROPERTY (one create, many rows)
// ------------------------------------------------------------
export async function createImagesForProperty(
  propertyId: string,
  images: { url: string; publicId: string }[]
) {
  return prisma.propertyImage.createMany({
    data: images.map((image) => ({
      propertyId,
      url: image.url,
      publicId: image.publicId,
    })),
  });
}

// ------------------------------------------------------------
// GET ALL IMAGES FOR A PROPERTY
// ------------------------------------------------------------
export async function findImagesByProperty(propertyId: string) {
  return prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { createdAt: "asc" },
  });
}