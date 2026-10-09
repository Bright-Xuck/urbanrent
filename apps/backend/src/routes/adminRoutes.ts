import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/RBAC.js";
import {
  GetUsers,
  GetUserById,
  SuspendUser,
  ReinstateUser,
} from "../controllers/adminController.js";
import {
  GetPendingDocuments,
  ReviewVerificationDocument,
} from "../controllers/verificationController.js";

const router: express.Router = express.Router();

router.get("/users", authenticate, requireAdmin, GetUsers);

router.get("/users/:id", authenticate, requireAdmin, GetUserById);

router.patch("/users/:id/suspend", authenticate, requireAdmin, SuspendUser);

router.patch("/users/:id/reinstate", authenticate, requireAdmin, ReinstateUser);

router.get("/verification/pending", authenticate, requireAdmin, GetPendingDocuments);

router.patch("/verification/:documentId/review", authenticate, requireAdmin, ReviewVerificationDocument);

export default router;
