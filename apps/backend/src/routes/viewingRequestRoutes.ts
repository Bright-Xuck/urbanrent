import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { blockIfSuspended } from "../middleware/blockIfSuspended.js";
import { requireLandordadmin } from "../middleware/RBAC.js";
import {
  GetMyViewingRequests,
  GetIncomingViewingRequests,
  GetViewingRequestById,
  ChangeViewingRequestStatus,
} from "../controllers/viewingRequestController.js";


const router: express.Router = express.Router();

/**
 * @swagger
 * /api/viewing-requests/mine:
 *   get:
 *     tags: [Viewing requests]
 *     summary: List viewing requests submitted by the caller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caller requests, newest first, with property details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [requests]
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ViewingRequest'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/mine", authenticate, GetMyViewingRequests);

/**
 * @swagger
 * /api/viewing-requests/incoming:
 *   get:
 *     tags: [Viewing requests]
 *     summary: List viewing requests for the caller's properties
 *     description: Landlord or admin only. A landlord sees requests for their own properties.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incoming requests, newest first, with tenant and property details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [requests]
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ViewingRequest'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not a landlord or admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/incoming", authenticate, requireLandordadmin, GetIncomingViewingRequests);

/**
 * @swagger
 * /api/viewing-requests/{id}:
 *   get:
 *     tags: [Viewing requests]
 *     summary: Get a viewing request
 *     description: Visible to the requesting tenant, property owner, or an admin.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Viewing request details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [request]
 *               properties:
 *                 request:
 *                   $ref: '#/components/schemas/ViewingRequest'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not allowed to view this request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Viewing request not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, GetViewingRequestById);

/**
 * @swagger
 * /api/viewing-requests/{id}/status:
 *   patch:
 *     tags: [Viewing requests]
 *     summary: Change a viewing request's status
 *     description: Property owner or admin only. CONFIRMED requires confirmedTime. Confirmation is rejected with 409 if it overlaps another confirmed viewing for the landlord; confirmed times must be at least 60 minutes apart.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [REQUESTED, CONFIRMED, DECLINED, COMPLETED, NO_SHOW]
 *               confirmedTime:
 *                 type: string
 *                 format: date-time
 *                 description: Required when status is CONFIRMED.
 *     responses:
 *       200:
 *         description: Viewing request updated.
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
 *         description: Invalid status, missing confirmedTime, or invalid status transition.
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
 *         description: Caller is not allowed to change this request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Viewing request not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Confirmed time overlaps another confirmed viewing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/status", authenticate, blockIfSuspended, ChangeViewingRequestStatus);

export default router;