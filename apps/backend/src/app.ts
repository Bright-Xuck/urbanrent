import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import amenityRoutes from './routes/amenityRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import propertyApplicationRoutes from './routes/propertyApplicationRoutes.js'
import viewingRequestRoutes from './routes/viewingRequestRoutes.js'
import propertyViewingRequestRoutes from './routes/propertyViewingRequestRoutes.js'
import adminRoutes from "./routes/adminRoutes.js"
import verificationRoutes from "./routes/verificationRoutes.js"
import propertyReportRoutes from "./routes/propertyReportRoutes.js"
import { apiLimiter } from './middleware/rateLimit.js';
import cors from 'cors'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import swaggerUi from 'swagger-ui-express';
import { openApiSpecification } from './config/openapi.js';

const app: Express = express();

// Render (and most hosts) put the app behind exactly one proxy hop.
// Trusting it makes req.ip read the real client from X-Forwarded-For;
// without it every request looks like the proxy's IP and the whole
// platform would share one rate-limit bucket. Locally there is no
// proxy, and trusting one would let clients spoof their IP via a
// header and dodge the limiters — so this only turns on when
// deployed (RENDER is set there; TRUST_PROXY is a manual override).
if (process.env.RENDER || process.env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.use(express.json());
// In production, restrict cross-origin requests to the deployed frontend
// origin(s) (comma-separated in FRONTEND_ORIGIN). Unset (local dev), any
// origin is allowed.
const frontendOrigins = process.env.FRONTEND_ORIGIN
  ?.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    credentials: true,
    origin: frontendOrigins && frontendOrigins.length > 0 ? frontendOrigins : true,
  }),
)
app.use(cookieParser())

// Gzip JSON responses before they leave the server. JSON compresses
// ~5-8x, which matters more the bigger the payloads get (property
// lists, admin queues). Registered early so every route benefits;
// already-compressed content (image bytes) is skipped automatically.
app.use(compression())

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Check API health
 *     responses:
 *       200:
 *         description: The API is running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [ok, message]
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server is running
 */
app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.get('/api/docs.json', (_req, res) => {
  res.json(openApiSpecification);
});
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpecification, { customSiteTitle: 'UrbanRent API Docs' }),
);

// Global API rate limit. Health checks and the public documentation routes
// are registered above this limiter and do not consume API request budget.
app.use('/api', apiLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propid', amenityRoutes)
app.use('/api/properties/:propertyId/applications', propertyApplicationRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/properties/:propertyId/viewing-requests', propertyViewingRequestRoutes)
app.use('/api/properties/:propertyId/reports', propertyReportRoutes)
app.use('/api/viewing-requests', viewingRequestRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/verification', verificationRoutes)

// ------------------------------------------------------------
// Error handler
// ------------------------------------------------------------
// Express routes can call next(err) — most notably multer when a file
// is rejected (wrong type / too large). Without a handler, Express
// returns HTML. This turns those errors into clean JSON responses.
// Must be registered AFTER all routes.
// ------------------------------------------------------------
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // multer.MulterError carries structured upload errors (e.g. size limit).
  if (err instanceof multer.MulterError) {
    res.status(400).json({ message: err.message });
    return;
  }
  // Custom errors thrown by our file filter use a plain Error.message.
  res.status(400).json({ message: err.message ?? "Bad request" });
});

export default app;