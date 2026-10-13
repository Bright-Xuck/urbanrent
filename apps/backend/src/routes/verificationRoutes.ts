import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireLandlord } from "../middleware/RBAC.js";
import {
  GetMyVerificationDocuments,
  UploadVerificationDocument,
} from "../controllers/verificationController.js";
import { documentUpload } from "../middleware/upload.js";
import { uploadLimiter } from "../middleware/rateLimit.js";

const router: express.Router = express.Router();

/**
 * @swagger
 * /api/verification/documents:
 *   post:
 *     tags: [Verification]
 *     summary: Upload a landlord verification document
 *     description: Upload one JPEG, PNG, WEBP, or PDF file (maximum 10 MiB) using the document multipart field. Document types are NATIONAL_ID and PROOF_OF_OWNERSHIP.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [documentType, document]
 *             properties:
 *               documentType:
 *                 type: string
 *                 enum: [NATIONAL_ID, PROOF_OF_OWNERSHIP]
 *               document:
 *                 type: string
 *                 format: binary
 *           encoding:
 *             document:
 *               contentType: image/jpeg, image/png, image/webp, application/pdf
 *     responses:
 *       201:
 *         description: Document uploaded for review.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, document]
 *               properties:
 *                 message:
 *                   type: string
 *                 document:
 *                   $ref: '#/components/schemas/VerificationDocument'
 *       400:
 *         description: Missing file, invalid document type, unsupported file type, or file exceeds 10 MiB.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not an active landlord.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/documents",
  authenticate,
  blockIfSuspended,
  requireLandlord,
  uploadLimiter,
  documentUpload.single("document"),
  UploadVerificationDocument,
);

/**
 * @swagger
 * /api/verification/documents:
 *   get:
 *     tags: [Verification]
 *     summary: List the caller's verification documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The caller's documents and aggregate verification state.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [documents, verificationState]
 *               properties:
 *                 documents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VerificationDocument'
 *                 verificationState:
 *                   type: string
 *                   enum: [UNVERIFIED, VERIFIED]
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not a landlord.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/documents", authenticate, requireLandlord, GetMyVerificationDocuments);

export default router;
