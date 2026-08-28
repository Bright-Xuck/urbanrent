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

  // uploadedPaths is used only for cleanup if something fails mid-upload.
  const uploadedPaths: string[] = []; // Supabase object paths

  try {
    // 2. Upload all files CONCURRENTLY.
    //    Promise.all runs each upload in parallel instead of one-at-a-time.
    //    Note: we push to uploadedPaths INSIDE each task BEFORE resolving,
    //    so even if one upload fails (and Promise.all rejects), the catch
    //    below still knows every path that actually got uploaded.
    const uploaded = await Promise.all(
      files.map(async (file) => {
        // Unique name per file, so two people uploading "photo.jpg"
        // never overwrite each other.
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
export async function getImagesForProperty(propertyId: string) {
  return findImagesByProperty(propertyId);
}