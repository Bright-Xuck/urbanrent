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

const DOCUMENT_FILE_SIZE = 10 * 1024 * 1024;

const allowedDocumentMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function documentFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (allowedDocumentMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files or PDFs are allowed (JPEG, PNG, WEBP, PDF)"));
  }
}

export const documentUpload = multer({
  storage,
  limits: { fileSize: DOCUMENT_FILE_SIZE },
  fileFilter: documentFilter,
});

export default upload;
