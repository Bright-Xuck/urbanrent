import express from 'express';
import { Register, Login, Refresh, Logout } from '../controllers/authController.js';
import { loginLimiter, refreshLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router: express.Router = express.Router()

//register route
router.post('/register', registerLimiter, Register)

//login route
router.post('/login', loginLimiter, Login)

//refresh token route - get a new access token using a refresh token
router.post('/refresh', refreshLimiter, Refresh)

//logout route - revoke the refresh token
router.post('/logout', Logout)

export default router