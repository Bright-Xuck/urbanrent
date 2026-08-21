import express, { type Express } from 'express';
import authRoutes from './routes/authRoutes.js';
import propertyRoutes from './routes/propertyRoutes.js';
import amenityRoutes from './routes/amenityRoutes.js'

const app: Express = express();

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/properties/:propid', amenityRoutes)

export default app;