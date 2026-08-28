import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  GetMyApplications,
  GetApplicationById,
  ChangeApplicationStatus,
} from "../controllers/applicationController.js";

// ============================================================
// APPLICATION ROUTES (flat, read/status by application id)
// ============================================================
// Mounted on: /api/applications
// These routes identify an application by ITS OWN id, so they don't
// need a property id in the URL. The nested create lives in
// propertyApplicationRoutes.ts (it needs the target property).
// ============================================================
const router: express.Router = express.Router();

// A tenant's own applications.
router.get("/mine", authenticate, GetMyApplications);

// View one application (applicant or property owner/admin).
router.get("/:id", authenticate, GetApplicationById);

// Change status (withdraw = tenant; decide = landlord/admin).
router.patch("/:id/status", authenticate, ChangeApplicationStatus);

export default router;