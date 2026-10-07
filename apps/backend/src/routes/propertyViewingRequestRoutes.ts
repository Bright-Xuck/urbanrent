import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateViewingRequest } from "../controllers/viewingRequestController.js";


const router: express.Router = express.Router({ mergeParams: true });


router.post("/", authenticate, requireTenant, CreateViewingRequest);

export default router;