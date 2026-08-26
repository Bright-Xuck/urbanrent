import multer from "multer";
import type { Request } from "express";

// ============================================================
// UPLOAD MIDDLEWARE
// ============================================================
// Multer is responsible for ONE job: accepting `multipart/form-data`
// and exposing the uploaded files on `req.files`.
//
// We use memoryStorage: the file is held in memory as a Buffer and
// handed straight to Supabase. No temporary file is written to disk.
//
// This middleware only EXTRACTS the file. Uploading to Supabase and
// saving the URL to the DB happens later in the service layer.
// ============================================================

// memoryStorage keeps files in RAM as Buffers (no disk writes).
// Each uploaded file becomes { buffer, mimetype, originalname, ... }.
const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image

// Only allow real image types. Anything else is rejected.
const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];

function imageFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, or WEBP)"));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFilter,
});

export default upload;
