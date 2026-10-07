import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateApplication } from "../controllers/applicationController.js";


const router: express.Router = express.Router({ mergeParams: true });


router.post("/", authenticate, requireTenant, CreateApplication);

export default router;