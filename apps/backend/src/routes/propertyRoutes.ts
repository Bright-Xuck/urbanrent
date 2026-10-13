import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
import { blockIfSuspended } from '../middleware/blockIfSuspended.js';
import { requireLandordadmin } from '../middleware/RBAC.js';
import {
  CreateProperty,
  GetProperties,
  GetMyProperties,
  GetPropertyById,
  UpdateProperty,
  DeleteProperty,
} from '../controllers/propertyController.js';
import {
  UploadPropertyImages,
  GetPropertyImages,
} from '../controllers/imageController.js';
import upload from '../middleware/upload.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router: express.Router = express.Router()

/**
 * @swagger
 * /api/properties:
 *   post:
 *     tags: [Properties]
 *     summary: Create a property listing
 *     description: Creates a draft by default. Publishing requires the owner to be verified.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyInput'
 *     responses:
 *       201:
 *         description: Listing created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, property]
 *               properties:
 *                 message:
 *                   type: string
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: The account is suspended or not verified to publish.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     tags: [Properties]
 *     summary: Browse published property listings
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of matching listings to skip.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Page size; values above 50 are capped at 50.
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *           enum: [APARTMENT, STUDIO, HOUSE, VILLA, COMMERCIAL, OTHER]
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: minRent
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - in: query
 *         name: maxRent
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - in: query
 *         name: minBedrooms
 *         schema:
 *           type: integer
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Published listings matching the filters.
 *         headers:
 *           X-Cache:
 *             description: Whether the response came from the property cache.
 *             schema:
 *               type: string
 *               enum: [HIT, MISS]
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyPage'
 *       400:
 *         description: Invalid pagination or rent range.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', authenticate, blockIfSuspended, CreateProperty)

router.get('/', GetProperties)

/**
 * @swagger
 * /api/properties/mine:
 *   get:
 *     tags: [Properties]
 *     summary: List the authenticated landlord's listings
 *     description: Includes listings in all statuses, including drafts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated listings owned by the caller.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PropertyPage'
 *       400:
 *         description: Invalid pagination.
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
 *         description: Caller is not a landlord or admin.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/mine', authenticate, requireLandordadmin, GetMyProperties)

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     tags: [Properties]
 *     summary: Get a property listing
 *     description: Published listings are public. Unpublished listings are visible only to their owner or an admin; hidden and unknown listings both return 404.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Listing details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [property]
 *               properties:
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         description: Listing does not exist or is not visible to the caller.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   patch:
 *     tags: [Properties]
 *     summary: Update a property listing
 *     description: Only the owner may update the listing. Publishing requires a verified owner.
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
 *             $ref: '#/components/schemas/PropertyUpdateInput'
 *     responses:
 *       200:
 *         description: Listing updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, property]
 *               properties:
 *                 message:
 *                   type: string
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not the owner, account is suspended, or landlord is not verified to publish.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Properties]
 *     summary: Delete a property listing
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
 *         description: Listing deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       401:
 *         description: Access token is missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Caller is not the listing owner or account is suspended.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', optionalAuthenticate, GetPropertyById)

router.patch('/:id', authenticate, blockIfSuspended, UpdateProperty)

router.delete('/:id', authenticate, blockIfSuspended, DeleteProperty)

//upload images to a property (owner only)
//multer's `.array('images', 5)` runs BEFORE the controller, reading the
//multipart body and placing the files on req.files.
/**
 * @swagger
 * /api/properties/{id}/images:
 *   post:
 *     tags: [Images]
 *     summary: Upload property images
 *     description: Upload up to five JPEG, PNG, or WEBP images; each file is limited to 5 MiB. The multipart field name is images.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [images]
 *             properties:
 *               images:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 5
 *                 items:
 *                   type: string
 *                   format: binary
 *           encoding:
 *             images:
 *               contentType: image/jpeg, image/png, image/webp
 *     responses:
 *       201:
 *         description: Images uploaded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: No files, unsupported file type, or file-size/count limit exceeded.
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
 *         description: Caller is not the owner or account is suspended.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Listing not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/images', authenticate, blockIfSuspended, uploadLimiter, upload.array('images', 5), UploadPropertyImages)

/**
 * @swagger
 * /api/properties/{id}/images:
 *   get:
 *     tags: [Images]
 *     summary: List images for a property
 *     description: Public for published listings; private listings are visible to their owner or an admin. An optional bearer token identifies the caller.
 *     security:
 *       - bearerAuth: []
 *       - {}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Property images.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [images]
 *               properties:
 *                 images:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PropertyImage'
 *       404:
 *         description: Listing not found or not visible to caller.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id/images', optionalAuthenticate, GetPropertyImages)

export default router