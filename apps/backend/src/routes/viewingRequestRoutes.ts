import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  GetMyViewingRequests,
  GetViewingRequestById,
  ChangeViewingRequestStatus,
} from "../controllers/viewingRequestController.js";

// ============================================================
// VIEWING REQUEST ROUTES (flat, read/status by request id)
// ============================================================
// Mounted on: /api/viewing-requests
// These routes identify a viewing request by ITS OWN id, so they
// don't need a property id in the URL. The nested create lives in
// propertyViewingRequestRoutes.ts (it needs the target property).
// ============================================================
const router: express.Router = express.Router();

// A tenant's own viewing requests.
router.get("/mine", authenticate, GetMyViewingRequests);

// View one viewing request (tenant or property owner/admin).
router.get("/:id", authenticate, GetViewingRequestById);

// Change status (confirm/decline/complete/no-show; owner/admin only).
router.patch("/:id/status", authenticate, ChangeViewingRequestStatus);

export default router;