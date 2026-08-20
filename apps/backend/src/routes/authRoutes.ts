import express from 'express';
import { Register, Login, Refresh, Logout } from '../controllers/authController.js';

const router: express.Router = express.Router()

//register route
router.post('/register', Register)

//login route
router.post('/login', Login)

//refresh token route - get a new access token using a refresh token
router.post('/refresh', Refresh)

//logout route - revoke the refresh token
router.post('/logout', Logout)

export default router