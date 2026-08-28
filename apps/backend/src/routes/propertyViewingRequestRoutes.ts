import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateViewingRequest } from "../controllers/viewingRequestController.js";

// ============================================================
// PROPERTY VIEWING REQUEST ROUTES (create only)
// ============================================================
// Mounted on: /api/properties/:propertyId/viewing-requests
// Only the CREATE endpoint lives here, because it needs the target
// property in the URL. The flat read/status routes live in
// viewingRequestRoutes.ts (mounted on /api/viewing-requests).
// ============================================================
const router: express.Router = express.Router({ mergeParams: true });

// Create a viewing request for a specific property (tenant only).
// Role-gating is RBAC middleware: requireTenant = "TENANT only".
router.post("/", authenticate, requireTenant, CreateViewingRequest);

export default router;