import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateViewingRequest } from "../controllers/viewingRequestController.js";


const router: express.Router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/properties/{propertyId}/viewing-requests:
 *   post:
 *     tags: [Viewing requests]
 *     summary: Request a property viewing
 *     description: Tenant only. The property must be published and at least one proposed time is required.
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
 *             required: [proposedTimes]
 *             properties:
 *               proposedTimes:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: string
 *                   format: date-time
 *                 example: ['2026-10-20T14:00:00.000Z']
 *     responses:
 *       201:
 *         description: Viewing request submitted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, request]
 *               properties:
 *                 message:
 *                   type: string
 *                 request:
 *                   $ref: '#/components/schemas/ViewingRequest'
 *       400:
 *         description: Property is not accepting viewings or proposedTimes is empty.
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
router.post("/", authenticate, blockIfSuspended, requireTenant, CreateViewingRequest);

export default router;