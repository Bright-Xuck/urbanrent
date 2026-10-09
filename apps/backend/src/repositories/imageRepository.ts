import prisma from "../config/prisma.js";


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