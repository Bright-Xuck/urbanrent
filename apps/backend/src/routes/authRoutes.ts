import express from 'express';
import { Register, Login, Refresh, Logout } from '../controllers/authController.js';
import { loginLimiter, refreshLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router: express.Router = express.Router()

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register an account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [TENANT, LANDLORD]
 *     responses:
 *       201:
 *         description: Account created. The password is never returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, user]
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/UserSummary'
 *       400:
 *         description: Request body is not valid JSON.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: An account already exists for this email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', registerLimiter, Register)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in and create a refresh session
 *     description: Returns a short-lived bearer access token and sets a Secure, HttpOnly RefreshToken cookie (7 days, path /api/auth). SameSite is configured by COOKIE_SAMESITE and defaults to lax. Send the access token in the Authorization header for protected endpoints; the browser sends the refresh cookie automatically over HTTPS.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login succeeded; a refresh cookie is set.
 *         headers:
 *           Set-Cookie:
 *             description: Secure, HttpOnly RefreshToken cookie scoped to /api/auth; SameSite is configured by COOKIE_SAMESITE.
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResult'
 *       400:
 *         description: Request body is not valid JSON.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Email or password is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginLimiter, Login)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh the access token
 *     description: Reads the RefreshToken HttpOnly cookie; do not send the refresh token in a JSON body.
 *     security:
 *       - refreshCookie: []
 *     responses:
 *       200:
 *         description: A new access token was issued.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [message, accessToken]
 *               properties:
 *                 message:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *       400:
 *         description: Refresh cookie is missing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Refresh token is invalid, expired, or revoked.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', refreshLimiter, Refresh)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Revoke the refresh session
 *     description: Reads the RefreshToken HttpOnly cookie and clears it using the same cookie attributes.
 *     security:
 *       - refreshCookie: []
 *     responses:
 *       200:
 *         description: Session revoked and refresh cookie cleared.
 *         headers:
 *           Set-Cookie:
 *             description: Expired RefreshToken cookie scoped to /api/auth.
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Refresh cookie is missing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Refresh token is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', Logout)

export default router