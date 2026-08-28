import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateApplication } from "../controllers/applicationController.js";

// ============================================================
// PROPERTY APPLICATION ROUTES (create only)
// ============================================================
// Mounted on: /api/properties/:propertyId/applications
// Only the CREATE endpoint lives here, because it's the one that
// needs a target property in the URL. The flat read/status routes
// live in applicationRoutes.ts (mounted on /api/applications).
// ============================================================
const router: express.Router = express.Router({ mergeParams: true });

// Create an application for a specific property (tenant only).
// Role-gating is RBAC middleware: requireTenant = "TENANT only".
router.post("/", authenticate, requireTenant, CreateApplication);

export default router;