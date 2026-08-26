import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import {
  CreateProperty,
  GetProperties,
  GetPropertyById,
  UpdateProperty,
  DeleteProperty,
} from '../controllers/propertyController.js';
import {
  UploadPropertyImages,
  GetPropertyImages,
} from '../controllers/imageController.js';
import upload from '../middleware/upload.js';

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

//upload images to a property (owner only)
//multer's `.array('images', 5)` runs BEFORE the controller, reading the
//multipart body and placing the files on req.files.
router.post('/:id/images', authenticate, upload.array('images', 5), UploadPropertyImages)

//get all images for a property
router.get('/:id/images', authenticate, GetPropertyImages)

export default router