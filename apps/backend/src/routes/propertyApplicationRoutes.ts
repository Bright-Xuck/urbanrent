import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireTenant } from "../middleware/RBAC.js";
import { CreateApplication } from "../controllers/applicationController.js";


const router: express.Router = express.Router({ mergeParams: true });

/**
 * @swagger
 * /api/properties/{propertyId}/applications:
 *   post:
 *     tags: [Applications]
 *     summary: Apply to rent a property
 *     description: Tenant only. The listing must be published; only one SUBMITTED or UNDER_REVIEW application per tenant and property is allowed.
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Application submitted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, application]
 *               properties:
 *                 message:
 *                   type: string
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *       400:
 *         description: Listing is not accepting applications.
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
 *       409:
 *         description: Caller already has an active application for this property.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", authenticate, blockIfSuspended, requireTenant, CreateApplication);

export default router;