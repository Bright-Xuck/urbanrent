import supabase from "../config/supabase.js";
import { randomUUID } from "node:crypto";
import { findPropertyById } from "../repositories/propertyRepository.js";
import {
  createImagesForProperty,
  findImagesByProperty,
} from "../repositories/imageRepository.js";

// Bucket where property images are stored.
const bucket = process.env.STORAGE_BUCKET ?? "property_images";

// ------------------------------------------------------------
// UPLOAD IMAGES FOR A PROPERTY (owner only)
// ------------------------------------------------------------
// The full logic, kept, but written simply:
//   1. Check the caller owns the property.
//   2. Upload every file to Supabase Storage.
//   3. Save all the URLs to the database.
//   4. If anything fails, delete the files we already uploaded
//      so nothing is left orphaned in the bucket.
// ------------------------------------------------------------
export async function uploadPropertyImages(
  propertyId: string,
  ownerId: string,
  files: Express.Multer.File[]
) {
  // 1. Ownership check
  const property = await findPropertyById(propertyId);
  if (!property) throw new Error("Property not found");
  if (property.ownerId !== ownerId) {
    throw new Error("You do not have permission to upload images to this property");
  }

  // These we fill as we upload. uploadedPaths is used only for cleanup.
  const uploaded = []; // { url, publicId }
  const uploadedPaths = []; // Supabase object paths

  try {
    // 2. Upload every file, one at a time
    for (const file of files) {
      // Unique name per file, so two people uploading "photo.jpg"
      // never overwrite each other.
      const objectPath = `properties/${propertyId}/${randomUUID()}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(objectPath, file.buffer, { contentType: file.mimetype });

      if (error) throw new Error(error.message);

      uploadedPaths.push(objectPath);
      const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
      uploaded.push({ url: data.publicUrl, publicId: objectPath });
    }

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
export async function getImagesForProperty(propertyId: string) {
  return findImagesByProperty(propertyId);
}