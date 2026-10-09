import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateApplication } from "../controllers/applicationController.js";


const router: express.Router = express.Router({ mergeParams: true });


router.post("/", authenticate, blockIfSuspended, requireTenant, CreateApplication);

export default router;