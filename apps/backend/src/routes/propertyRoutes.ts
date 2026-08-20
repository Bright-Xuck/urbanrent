import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  CreateProperty,
  GetProperties,
  GetPropertyById,
  UpdateProperty,
  DeleteProperty,
} from '../controllers/propertyController.js';

const router: express.Router = express.Router()

// All property routes require authentication.
// The `authenticate` middleware runs first, sets req.user,
// and the controller uses req.user.userId as the ownerId.

//create property
router.post('/', authenticate, CreateProperty)

//get all properties (owner's own listings)
router.get('/', authenticate, GetProperties)

//get a single property by id
router.get('/:id', authenticate, GetPropertyById)

//update a property (owner only)
router.patch('/:id', authenticate, UpdateProperty)

//delete a property (owner only)
router.delete('/:id', authenticate, DeleteProperty)

export default router