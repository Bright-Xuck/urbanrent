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

/**
 * @swagger
 * /api/applications/mine:
 *   get:
 *     tags: [Applications]
 *     summary: List applications submitted by the caller
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caller applications, newest first, with property details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [applications]
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/mine", authenticate, GetMyApplications);

/**
 * @swagger
 * /api/applications/incoming:
 *   get:
 *     tags: [Applications]
 *     summary: List applications to the caller's properties
 *     description: Landlord or admin only. A landlord sees applications for their own properties.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Incoming applications, newest first, with tenant and property details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [applications]
 *               properties:
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Application'
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
router.get("/incoming", authenticate, requireLandordadmin, GetIncomingApplications);

/**
 * @swagger
 * /api/applications/{id}:
 *   get:
 *     tags: [Applications]
 *     summary: Get an application
 *     description: Visible to the applicant, the property's owner, or an admin.
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
 *         description: Application details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [application]
 *               properties:
 *                 application:
 *                   $ref: '#/components/schemas/Application'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not allowed to view this application.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Application not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", authenticate, GetApplicationById);

/**
 * @swagger
 * /api/applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Change an application's status
 *     description: A tenant may withdraw their own application. The property owner or an admin may move it to UNDER_REVIEW, APPROVED, or REJECTED; transitions from terminal states are rejected.
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
 *                 enum: [SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN]
 *     responses:
 *       200:
 *         description: Application updated.
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
 *         description: Invalid status or transition.
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
 *         description: Caller is not allowed to change this application.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Application not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/status", authenticate, blockIfSuspended, ChangeApplicationStatus);

export default router;