import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireLandordadmin } from "../middleware/RBAC.js";
import {
  GetMyViewingRequests,
  GetIncomingViewingRequests,
  GetViewingRequestById,
  ChangeViewingRequestStatus,
} from "../controllers/viewingRequestController.js";


const router: express.Router = express.Router();

router.get("/mine", authenticate, GetMyViewingRequests);

router.get("/incoming", authenticate, requireLandordadmin, GetIncomingViewingRequests);

router.get("/:id", authenticate, GetViewingRequestById);

router.patch("/:id/status", authenticate, ChangeViewingRequestStatus);

export default router;