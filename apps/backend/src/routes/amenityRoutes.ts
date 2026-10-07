import express from 'express'
import { authenticate } from '../middleware/authenticate.js'
import { getAmenities, postAmenity, deletebyId } from '../controllers/amenityController.js'


const router: express.Router = express.Router({ mergeParams: true })


router.get("/amenities", getAmenities)

router.post("/amenities", authenticate, postAmenity)

router.delete("/amenities/:id", authenticate, deletebyId)

export default router