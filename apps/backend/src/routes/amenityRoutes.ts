import express from 'express'
import { getAmenities, postAmenity, deletebyId } from '../controllers/amenityController.js'

const router: express.Router = express.Router({ mergeParams: true })

router.get("/", getAmenities)

router.post("/", postAmenity)

router.delete("/:id", deletebyId)

export default router