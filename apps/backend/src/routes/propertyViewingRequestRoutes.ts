import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateViewingRequest } from "../controllers/viewingRequestController.js";


const router: express.Router = express.Router({ mergeParams: true });


router.post("/", authenticate, blockIfSuspended, requireTenant, CreateViewingRequest);

export default router;