import express from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { getAmenities, postAmenity, deletebyId } from '../controllers/amenityController.js'

// ============================================================
// AMENITY ROUTES
// ============================================================
// Mounted on: /api/properties/:propid  (mergeParams gives us :propid)
//
// These sit under an explicit /amenities sub-path. They used to be mounted
// directly on / (i.e. GET /api/properties/:id), which propertyRoutes already
// answers with GET /:id — the property controller captured every request and
// the amenity router was never reached. A distinct path removes the clash
// entirely: /api/properties/:propid/amenities can never collide with
// /api/properties/:id.
//
// Every route requires a token. POST and DELETE additionally check that the
// caller owns the property (or is an ADMIN) — that check lives in the
// controller, mirroring how property update/delete are guarded.
// ============================================================
const router: express.Router = express.Router({ mergeParams: true })

// List the amenities linked to this property.
router.get("/amenities", authenticate, getAmenities)

// Create an amenity and link it to this property (owner only).
router.post("/amenities", authenticate, postAmenity)

// Delete an amenity by its AMENITY id (owner only).
router.delete("/amenities/:id", authenticate, deletebyId)

export default router