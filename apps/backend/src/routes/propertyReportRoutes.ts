import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateReport } from "../controllers/reportController.js";

const router: express.Router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/properties/{propertyId}/reports:
 *   post:
 *     tags: [Reports]
 *     summary: Report a property listing
 *     description: Tenant only. A tenant may have one open report for a property at a time.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [SCAM_OR_FRAUD, MISLEADING_INFORMATION, ALREADY_RENTED, OTHER]
 *     responses:
 *       201:
 *         description: Report submitted for review.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, report]
 *               properties:
 *                 message:
 *                   type: string
 *                 report:
 *                   $ref: '#/components/schemas/PropertyReport'
 *       400:
 *         description: Invalid reason or an open report already exists.
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
 *         description: Caller is not a tenant or account is suspended.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Property not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", authenticate, blockIfSuspended, requireTenant, CreateReport);

export default router;
