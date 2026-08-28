import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import amenityRoutes from './routes/amenityRoutes.js'
import applicationRoutes from './routes/applicationRoutes.js'
import propertyApplicationRoutes from './routes/propertyApplicationRoutes.js'
import viewingRequestRoutes from './routes/viewingRequestRoutes.js'
import propertyViewingRequestRoutes from './routes/propertyViewingRequestRoutes.js'

const app: Express = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propid', amenityRoutes)
app.use('/api/properties/:propertyId/applications', propertyApplicationRoutes)
app.use('/api/applications', applicationRoutes)
app.use('/api/properties/:propertyId/viewing-requests', propertyViewingRequestRoutes)
app.use('/api/viewing-requests', viewingRequestRoutes)

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