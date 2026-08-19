import express from 'express';
import { Register } from '../controllers/authController.js';

const router: express.Router = express.Router()

//register route
router.post('/register', Register)



export default router