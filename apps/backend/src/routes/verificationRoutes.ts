import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireLandlord } from "../middleware/RBAC.js";
import {
  GetMyVerificationDocuments,
  UploadVerificationDocument,
} from "../controllers/verificationController.js";
import { documentUpload } from "../middleware/upload.js";

const router: express.Router = express.Router();

router.post(
  "/documents",
  authenticate,
  blockIfSuspended,
  requireLandlord,
  documentUpload.single("document"),
  UploadVerificationDocument,
);

router.get("/documents", authenticate, requireLandlord, GetMyVerificationDocuments);

export default router;
