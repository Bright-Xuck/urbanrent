import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireLandordadmin } from "../middleware/RBAC.js";
import {
  GetMyApplications,
  GetIncomingApplications,
  GetApplicationById,
  ChangeApplicationStatus,
} from "../controllers/applicationController.js";



const router: express.Router = express.Router();


router.get("/mine", authenticate, GetMyApplications);


router.get("/incoming", authenticate, requireLandordadmin, GetIncomingApplications);


router.get("/:id", authenticate, GetApplicationById);


router.patch("/:id/status", authenticate, blockIfSuspended, ChangeApplicationStatus);

export default router;