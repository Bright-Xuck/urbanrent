import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
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

const router: express.Router = express.Router()

//create property
router.post('/', authenticate, CreateProperty)

//get all properties - PUBLIC marketplace browse (published only)
//No authenticate: any visitor can browse listings.
router.get('/', GetProperties)

//get MY properties - authenticated owner dashboard (landlord/admin only)
//IMPORTANT: this must be registered BEFORE the /:id route below, otherwise
//Express would treat the literal "mine" as a value for the :id param and
//swallow this route.
router.get('/mine', authenticate, requireLandordadmin, GetMyProperties)

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