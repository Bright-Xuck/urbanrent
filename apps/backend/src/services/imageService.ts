import supabase from "../config/supabase.js";
import { randomUUID } from "node:crypto";
import { findPropertyById } from "../repositories/propertyRepository.js";
import { getPropertyById } from "./propertyService.js";
import {
  createImagesForProperty,
  findImagesByProperty,
} from "../repositories/imageRepository.js";

const bucket = process.env.STORAGE_BUCKET ?? "property_images";

export async function uploadPropertyImages(
  propertyId: string,
  ownerId: string,
  files: Express.Multer.File[]
) {
  
  const property = await findPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.ownerId !== ownerId) {
    throw new Error("You do not have permission to upload images to this property");
  }

  // uploadedPaths is used only for cleanup if something fails mid-upload.
  const uploadedPaths: string[] = []; 

  try {
    // 2. Upload all files CONCURRENTLY.
    //    Promise.all runs each upload in parallel instead of one-at-a-time.
    //    Note: we push to uploadedPaths INSIDE each task BEFORE resolving,
    //    so even if one upload fails (and Promise.all rejects), the catch
    //    below still knows every path that actually got uploaded.
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const objectPath = `properties/${propertyId}/${randomUUID()}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(objectPath, file.buffer, { contentType: file.mimetype });

        if (error) throw new Error(error.message);

        uploadedPaths.push(objectPath);
        const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
        return { url: data.publicUrl, publicId: objectPath };
      })
    );

    // 3. Save them all at once in the database
    return await createImagesForProperty(propertyId, uploaded);
  } catch (err) {
    // 4. Cleanup: remove files we already uploaded so nothing is left behind
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(bucket).remove(uploadedPaths);
    }
    throw err;
  }
}
// ------------------------------------------------------------
// GET ALL IMAGES FOR A PROPERTY
// ------------------------------------------------------------
// Public like the listing itself, so it applies the same visibility rule
// (see `getPropertyById` in propertyService): a guest may read the photos
// of a PUBLISHED property, while a draft's photos stay private to its
// owner/admin. A hidden property throws "Property not found".
export async function getImagesForProperty(
  propertyId: string,
  viewer?: { userId: string; role: string } | null
) {
  await getPropertyById(propertyId, viewer ?? null);
  return findImagesByProperty(propertyId);
}