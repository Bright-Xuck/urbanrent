import express from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { blockIfSuspended } from '../middleware/blockIfSuspended.js'
import { getAmenities, postAmenity, deletebyId } from '../controllers/amenityController.js'


const router: express.Router = express.Router({ mergeParams: true })


router.get("/amenities", getAmenities)

router.post("/amenities", authenticate, blockIfSuspended, postAmenity)

router.delete("/amenities/:id", authenticate, blockIfSuspended, deletebyId)

export default router