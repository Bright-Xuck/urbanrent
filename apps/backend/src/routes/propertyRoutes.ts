import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js';
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


router.post('/', authenticate, CreateProperty)

router.get('/', GetProperties)


router.get('/mine', authenticate, requireLandordadmin, GetMyProperties)

router.get('/:id', optionalAuthenticate, GetPropertyById)

router.patch('/:id', authenticate, UpdateProperty)

router.delete('/:id', authenticate, DeleteProperty)

//upload images to a property (owner only)
//multer's `.array('images', 5)` runs BEFORE the controller, reading the
//multipart body and placing the files on req.files.
router.post('/:id/images', authenticate, upload.array('images', 5), UploadPropertyImages)

router.get('/:id/images', optionalAuthenticate, GetPropertyImages)

export default router