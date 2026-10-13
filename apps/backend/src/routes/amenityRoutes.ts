import express from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { blockIfSuspended } from '../middleware/blockIfSuspended.js'
import { getAmenities, postAmenity, deletebyId } from '../controllers/amenityController.js'


const router: express.Router = express.Router({ mergeParams: true })

/**
 * @swagger
 * /api/properties/{propid}/amenities:
 *   get:
 *     tags: [Amenities]
 *     summary: List a property's amenities
 *     parameters:
 *       - in: path
 *         name: propid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Amenities linked to the property.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PropertyAmenity'
 *       400:
 *         description: Invalid property ID.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Could not load the amenities.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     tags: [Amenities]
 *     summary: Add an amenity to a property
 *     description: Only the property's landlord-owner or an admin may add amenities.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propid
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               pictureurl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Amenity created and linked to the property.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, amenities, link]
 *               properties:
 *                 message:
 *                   type: string
 *                 amenities:
 *                   $ref: '#/components/schemas/Amenity'
 *                 link:
 *                   type: object
 *       400:
 *         description: Amenity name is missing or invalid.
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
 *         description: Caller cannot manage amenities for this property.
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
router.get("/amenities", getAmenities)

router.post("/amenities", authenticate, blockIfSuspended, postAmenity)

/**
 * @swagger
 * /api/properties/{propid}/amenities/{id}:
 *   delete:
 *     tags: [Amenities]
 *     summary: Remove an amenity from a property
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: id
 *         required: true
 *         description: Amenity ID.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Amenity removed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, deletedRes]
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedRes:
 *                   $ref: '#/components/schemas/Amenity'
 *       400:
 *         description: Invalid property or amenity ID.
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
 *         description: Caller cannot manage amenities for this property.
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
router.delete("/amenities/:id", authenticate, blockIfSuspended, deletebyId)

export default router