import multer from "multer";
import type { Request } from "express";

const storage = multer.memoryStorage();

const MAX_FILE_SIZE = 5 * 1024 * 1024; 

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
